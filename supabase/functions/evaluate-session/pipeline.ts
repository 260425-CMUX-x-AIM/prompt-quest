import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { parse as parseYaml } from 'jsr:@std/yaml';
import type { TaskDefinition } from './types.ts';
import { validateArtifact } from './validator.ts';
import { analyzeQuantitative } from './quantitative.ts';
import { judgeWithEnsemble } from './judge.ts';
import { aggregate } from './aggregator.ts';

const STAGE_TIMEOUT_MS = {
  validator: 15_000,
  quantitative: 2_000,
  judge: 45_000,
  aggregator: 1_000,
} as const;

type EvaluationStage = 'validator' | 'quantitative' | 'judge' | 'aggregator';

export async function runEvaluationPipeline(sessionId: string): Promise<void> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: session } = await supabase
    .from('sessions')
    .select(
      `
      *,
      tasks(id, difficulty, yaml_definition),
      messages(role, content, input_tokens, output_tokens),
      artifacts!inner(content, language)
    `,
    )
    .eq('id', sessionId)
    .eq('artifacts.is_final', true)
    .single();

  if (!session) {
    await markFailed(supabase, sessionId, 'session_not_found');
    return;
  }

  const taskDefinition = parseYaml(session.tasks.yaml_definition) as TaskDefinition;
  const artifact = session.artifacts[0]?.content ?? '';

  const { data: evaluation } = await supabase
    .from('evaluations')
    .upsert(
      {
        session_id: sessionId,
        validator_passed: false,
        validator_reason: null,
      },
      { onConflict: 'session_id' },
    )
    .select()
    .single();

  if (!evaluation) {
    await markFailed(supabase, sessionId, 'evaluation_row_upsert_failed');
    return;
  }

  try {
    const validatorResult = await runStage(
      supabase,
      evaluation.id,
      'validator',
      {
        session_id: sessionId,
        requirements: taskDefinition.requirements,
        artifact,
        test_cases: taskDefinition.test_cases,
      },
      STAGE_TIMEOUT_MS.validator,
      () => validateArtifact(taskDefinition, artifact),
    );

    if (!validatorResult.passed) {
      await supabase
        .from('evaluations')
        .update({
          validator_passed: false,
          validator_reason: validatorResult.overall_reason,
          total_score: 0,
          scores: {
            correctness: 0,
            efficiency: 0,
            context: 0,
            recovery: 0,
            clarity: 0,
            pattern_bonus: 0,
          },
          feedback: {
            good: '',
            improve: validatorResult.failed_requirements
              .map((failure) => `[${failure.id}] ${failure.reason}`)
              .join('\n'),
          },
          percentile: 0,
          meta: {
            baseline_source: 'estimated',
            judge_runs_succeeded: 0,
            judge_max_stddev: 0,
            is_low_confidence: true,
          },
        })
        .eq('id', evaluation.id);

      await markEvaluated(supabase, sessionId);
      return;
    }

    const baseline = await loadBaseline(supabase, session.task_id, taskDefinition);
    const quantitativeResult = await runStage(
      supabase,
      evaluation.id,
      'quantitative',
      { session_id: sessionId, baseline },
      STAGE_TIMEOUT_MS.quantitative,
      () => analyzeQuantitative(session, session.messages ?? [], baseline),
    );

    const judgeResult = await runStage(
      supabase,
      evaluation.id,
      'judge',
      { session_id: sessionId, message_count: session.messages?.length ?? 0 },
      STAGE_TIMEOUT_MS.judge,
      () => judgeWithEnsemble(taskDefinition, session.messages ?? [], artifact),
    );

    const scoreDistribution = await loadScoreDistribution(supabase, session.task_id);
    const aggregatedResult = await runStage(
      supabase,
      evaluation.id,
      'aggregator',
      { session_id: sessionId, score_distribution_size: scoreDistribution.length },
      STAGE_TIMEOUT_MS.aggregator,
      () =>
        aggregate({
          validator: validatorResult,
          quantitative: quantitativeResult,
          judge: judgeResult,
          task: session.tasks,
          scoreDistribution,
        }),
    );

    await supabase
      .from('evaluations')
      .update({
        validator_passed: true,
        validator_reason: validatorResult.overall_reason,
        total_score: aggregatedResult.total_score,
        scores: aggregatedResult.scores,
        feedback: aggregatedResult.feedback,
        percentile: aggregatedResult.percentile,
        meta: aggregatedResult.meta,
      })
      .eq('id', evaluation.id);

    await markEvaluated(supabase, sessionId);
  } catch (error) {
    await markFailed(supabase, sessionId, error instanceof Error ? error.message : String(error));
  }
}

async function runStage<T>(
  supabase: SupabaseClient,
  evaluationId: string,
  stage: EvaluationStage,
  inputData: unknown,
  timeoutMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const { data: stageRow } = await supabase
    .from('evaluation_stages')
    .insert({
      evaluation_id: evaluationId,
      session_id:
        inputData &&
        typeof inputData === 'object' &&
        'session_id' in (inputData as Record<string, unknown>)
          ? ((inputData as Record<string, unknown>).session_id as string | null)
          : null,
      stage,
      status: 'running',
      input_data: inputData as object,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  const startTime = Date.now();

  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`${stage}_timeout`)), timeoutMs),
      ),
    ]);

    await supabase
      .from('evaluation_stages')
      .update({
        status: 'success',
        output_data: result as object,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      })
      .eq('id', stageRow?.id);

    return result;
  } catch (error) {
    await supabase
      .from('evaluation_stages')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      })
      .eq('id', stageRow?.id);

    throw error;
  }
}

async function loadBaseline(
  supabase: SupabaseClient,
  taskId: string,
  taskDefinition: TaskDefinition,
): Promise<{
  median_total_tokens: number;
  median_attempts: number;
  median_time_seconds: number;
  source: 'observed' | 'estimated' | 'default';
}> {
  const { data } = await supabase.from('task_baselines').select('*').eq('task_id', taskId).single();

  if (data && data.sample_size >= 30) {
    return {
      median_total_tokens: data.median_total_tokens,
      median_attempts: data.median_attempts,
      median_time_seconds: data.median_time_seconds,
      source: 'observed',
    };
  }

  if (taskDefinition.baseline?.median_total_tokens) {
    return {
      median_total_tokens: taskDefinition.baseline.median_total_tokens,
      median_attempts: taskDefinition.baseline.median_attempts ?? 2,
      median_time_seconds: taskDefinition.baseline.median_time_seconds ?? 600,
      source: 'estimated',
    };
  }

  const defaults = {
    easy: { tokens: 1000, attempts: 2, time: 300 },
    medium: { tokens: 3000, attempts: 3, time: 900 },
    hard: { tokens: 6000, attempts: 5, time: 1800 },
  } as const;
  const fallback = defaults[taskDefinition.metadata.difficulty];

  return {
    median_total_tokens: fallback.tokens,
    median_attempts: fallback.attempts,
    median_time_seconds: fallback.time,
    source: 'default',
  };
}

async function loadScoreDistribution(supabase: SupabaseClient, taskId: string): Promise<number[]> {
  const { data } = await supabase
    .from('evaluations')
    .select('total_score, sessions!inner(task_id)')
    .eq('sessions.task_id', taskId)
    .eq('validator_passed', true)
    .gt('total_score', 0)
    .limit(500);

  return (data ?? [])
    .map((row) => row.total_score)
    .filter((score): score is number => typeof score === 'number');
}

async function markEvaluated(supabase: SupabaseClient, sessionId: string): Promise<void> {
  await supabase
    .from('sessions')
    .update({
      status: 'evaluated',
      evaluated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
}

async function markFailed(
  supabase: SupabaseClient,
  sessionId: string,
  reason: string,
): Promise<void> {
  await supabase
    .from('sessions')
    .update({
      status: 'failed',
    })
    .eq('id', sessionId);

  console.error(`evaluate-session failed (${sessionId}): ${reason}`);
}
