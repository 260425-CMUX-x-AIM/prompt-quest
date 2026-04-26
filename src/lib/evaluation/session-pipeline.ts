import { parse as parseYaml } from 'yaml';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createJsonCompletion, getEvaluationProviderConfig } from '@/lib/evaluation/providers';
import type { TaskDefinition } from '@/lib/types/task';
import type {
  AggregatedResult,
  EvaluationStageName,
  JudgeResult,
  JudgeRunResult,
  QuantitativeResult,
  ValidatorResult,
} from '@/lib/types/evaluation';

type SupabaseAdmin = ReturnType<typeof getSupabaseAdminClient>;

interface SessionRow {
  id: string;
  task_id: string;
  attempt_count: number;
  total_input_tokens: number;
  total_output_tokens: number;
  started_at: string | null;
  submitted_at: string | null;
  tasks: { id: string; difficulty: 'easy' | 'medium' | 'hard'; yaml_definition: string } | null;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  artifacts: Array<{ content: string; language: string | null }>;
}

const STAGE_TIMEOUT_MS = {
  validator: 15_000,
  quantitative: 2_000,
  judge: 45_000,
  aggregator: 1_000,
} as const;

export async function runSessionEvaluationPipeline(sessionId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
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
    .single<SessionRow>();

  if (!session || !session.tasks) {
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
        total_score: null,
        scores: null,
        feedback: null,
        meta: null,
        percentile: null,
      },
      { onConflict: 'session_id' },
    )
    .select('id')
    .single<{ id: string }>();

  if (!evaluation) {
    await markFailed(supabase, sessionId, 'evaluation_row_upsert_failed');
    return;
  }

  try {
    const validatorResult = await runStage(
      supabase,
      evaluation.id,
      'validator',
      { session_id: sessionId, requirements: taskDefinition.requirements, artifact },
      STAGE_TIMEOUT_MS.validator,
      () => validateArtifact(taskDefinition, artifact),
    );

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
          taskDefinition,
          quantitative: quantitativeResult,
          judge: judgeResult,
          task: session.tasks!,
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
  supabase: SupabaseAdmin,
  evaluationId: string,
  stage: EvaluationStageName,
  inputData: Record<string, unknown>,
  timeoutMs: number,
  fn: () => Promise<T> | T,
): Promise<T> {
  const { data: stageRow } = await supabase
    .from('evaluation_stages')
    .insert({
      evaluation_id: evaluationId,
      session_id: inputData.session_id,
      stage,
      status: 'running',
      input_data: inputData,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single<{ id: string }>();

  const startTime = Date.now();
  try {
    const result = await Promise.race([
      Promise.resolve(fn()),
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

async function validateArtifact(
  taskDefinition: TaskDefinition,
  artifact: string,
): Promise<ValidatorResult> {
  if (taskDefinition.artifact_format.type === 'regex') {
    return validateRegexArtifact(taskDefinition, artifact.trim());
  }

  const config = getEvaluationProviderConfig();
  if (!config.apiKey) {
    return heuristicValidateArtifact(taskDefinition, artifact);
  }

  const response = await createJsonCompletion<{
    passed_requirements?: string[];
    failed_requirements?: Array<{ id?: string; reason?: string }>;
    overall_reason?: string;
    test_results?: Array<{
      id?: string;
      type?: string;
      passed?: boolean;
      input?: unknown;
      expected?: unknown;
      actual?: unknown;
      reason?: string;
    }>;
  }>(config, {
    system:
      '당신은 결과물의 요구사항 충족 여부를 판정하는 검증관입니다. 테스트케이스별 통과 여부를 포함해 반드시 JSON으로만 답하세요.',
    prompt: JSON.stringify({
      task: taskDefinition.metadata.title,
      requirements: taskDefinition.requirements,
      test_cases: taskDefinition.test_cases,
      artifact,
      output_schema: {
        passed_requirements: ['req-1'],
        failed_requirements: [{ id: 'req-2', reason: '실패 이유' }],
        overall_reason: '전체 판정 요약',
        test_results: [
          {
            id: 'tc-1',
            type: 'positive',
            passed: true,
            input: '테스트 입력',
            expected: '기대 결과',
            actual: '제출 결과가 테스트를 어떻게 만족/불만족했는지',
            reason: '실패 시 이유',
          },
        ],
      },
    }),
    model: config.validatorModel,
    temperature: 0,
    maxOutputTokens: 1200,
  });

  const failedRequirements = (response.failed_requirements ?? [])
    .map((item) => ({
      id: item.id?.trim() || 'unknown',
      reason: item.reason?.trim() || '실패 이유가 제공되지 않았습니다.',
    }))
    .filter((item) => item.id);

  return {
    passed: failedRequirements.length === 0,
    passed_requirements: (response.passed_requirements ?? []).filter(Boolean),
    failed_requirements: failedRequirements,
    test_results: normalizeLlmTestResults(taskDefinition, response.test_results),
    overall_reason: response.overall_reason?.trim() || '검증 결과 요약이 없습니다.',
  };
}

function normalizeLlmTestResults(
  taskDefinition: TaskDefinition,
  testResults:
    | Array<{
        id?: string;
        type?: string;
        passed?: boolean;
        input?: unknown;
        expected?: unknown;
        actual?: unknown;
        reason?: string;
      }>
    | undefined,
): ValidatorResult['test_results'] {
  if (!Array.isArray(testResults) || testResults.length === 0) return undefined;

  const testCaseById = new Map(
    taskDefinition.test_cases.map((testCase) => [testCase.id, testCase]),
  );
  return testResults.flatMap((result) => {
    const testCase = result.id ? testCaseById.get(result.id) : undefined;
    if (!testCase) return [];

    return {
      id: testCase.id,
      type: testCase.type,
      passed: Boolean(result.passed),
      input: result.input ?? testCase.input,
      expected: result.expected ?? testCase.expected_matches ?? testCase.expected_output ?? null,
      actual: result.actual ?? null,
      reason: result.reason,
    };
  });
}

function validateRegexArtifact(taskDefinition: TaskDefinition, artifact: string): ValidatorResult {
  const regexParts = parseRegexArtifact(artifact);
  if (!regexParts) {
    return failAllRequirements(taskDefinition, '정규식 패턴을 찾지 못했습니다.');
  }

  const { pattern, flags } = regexParts;
  const failedRequirements: ValidatorResult['failed_requirements'] = [];
  const testResults: NonNullable<ValidatorResult['test_results']> = [];
  try {
    const regex = new RegExp(pattern, flags);
    for (const testCase of taskDefinition.test_cases) {
      if (typeof testCase.input !== 'string') continue;
      const matches = [
        ...testCase.input.matchAll(
          new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`),
        ),
      ].map((match) => match[0]);
      const expected = Array.isArray(testCase.expected_matches)
        ? testCase.expected_matches.filter((value): value is string => typeof value === 'string')
        : Array.isArray(testCase.expected_output)
          ? testCase.expected_output.filter((value): value is string => typeof value === 'string')
          : [];
      const passed = JSON.stringify(matches) === JSON.stringify(expected);
      testResults.push({
        id: testCase.id,
        type: testCase.type,
        passed,
        input: testCase.input,
        expected,
        actual: matches,
        reason: passed ? undefined : '기대 매칭과 실제 매칭이 다릅니다.',
      });
      if (!passed) {
        failedRequirements.push({
          id: 'req-1',
          reason: `${testCase.id}에서 기대 매칭과 실제 매칭이 다릅니다. expected=${JSON.stringify(expected)}, actual=${JSON.stringify(matches)}`,
        });
      }
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : '정규식을 해석하지 못했습니다.';
    failedRequirements.push({
      id: 'req-1',
      reason,
    });
    for (const testCase of taskDefinition.test_cases) {
      testResults.push({
        id: testCase.id,
        type: testCase.type,
        passed: false,
        input: testCase.input,
        expected: testCase.expected_matches ?? testCase.expected_output ?? null,
        actual: null,
        reason,
      });
    }
  }

  for (const forbiddenPattern of taskDefinition.constraints.forbidden_patterns ?? []) {
    if (artifact.includes(forbiddenPattern)) {
      failedRequirements.push({
        id: 'req-3',
        reason: `금지 패턴(${forbiddenPattern})이 포함되어 있습니다.`,
      });
    }
  }

  const failedIds = new Set(failedRequirements.map((item) => item.id));
  return {
    passed: failedRequirements.length === 0,
    passed_requirements: taskDefinition.requirements
      .map((item) => item.id)
      .filter((id) => !failedIds.has(id)),
    failed_requirements: failedRequirements,
    test_results: testResults,
    overall_reason:
      failedRequirements.length === 0
        ? '정적 regex 테스트를 통과했습니다.'
        : '정적 regex 테스트에서 실패했습니다.',
  };
}

function parseRegexArtifact(artifact: string): { pattern: string; flags: string } | null {
  const trimmed = artifact
    .trim()
    .replace(/^```(?:regex|javascript|js|typescript|ts)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  const literal = trimmed.match(/\/((?:\\.|[^/])+)\/([a-z]*)/);
  if (literal) return { pattern: literal[1], flags: literal[2] };
  if (!trimmed || /\s/.test(trimmed)) return null;
  return { pattern: trimmed, flags: 'g' };
}

function heuristicValidateArtifact(
  taskDefinition: TaskDefinition,
  artifact: string,
): ValidatorResult {
  const trimmedArtifact = artifact.trim();
  if (!trimmedArtifact || /TODO|YOUR_PATTERN_HERE/.test(trimmedArtifact)) {
    return failAllRequirements(taskDefinition, '결과물이 비어 있거나 placeholder 상태입니다.');
  }
  return {
    passed: true,
    passed_requirements: taskDefinition.requirements.map((item) => item.id),
    failed_requirements: [],
    overall_reason: 'LLM API 키가 없어 기본 정적 검증으로 통과 처리했습니다.',
  };
}

function failAllRequirements(taskDefinition: TaskDefinition, reason: string): ValidatorResult {
  return {
    passed: false,
    passed_requirements: [],
    failed_requirements: taskDefinition.requirements.map((requirement) => ({
      id: requirement.id,
      reason,
    })),
    test_results: taskDefinition.test_cases.map((testCase) => ({
      id: testCase.id,
      type: testCase.type,
      passed: false,
      input: testCase.input,
      expected: testCase.expected_matches ?? testCase.expected_output ?? null,
      actual: null,
      reason,
    })),
    overall_reason: reason,
  };
}

interface Baseline {
  median_total_tokens: number;
  median_attempts: number;
  median_time_seconds: number;
  source: 'observed' | 'estimated' | 'default';
}

function analyzeQuantitative(
  session: SessionRow,
  messages: SessionRow['messages'],
  baseline: Baseline,
): QuantitativeResult {
  const totalTokens = session.total_input_tokens + session.total_output_tokens;
  const tokenScore = ratioToScore(baseline.median_total_tokens, Math.max(totalTokens, 1), 12);
  const attemptScore = ratioToScore(
    baseline.median_attempts,
    Math.max(session.attempt_count, 1),
    12,
  );
  const elapsedSeconds = getElapsedSeconds(session);
  const timeScore = ratioToScore(baseline.median_time_seconds, Math.max(elapsedSeconds, 1), 6);
  const patterns = analyzePatterns(messages);
  const patternAdjustment = computePatternAdjustment(patterns, messages.length);
  return {
    efficiency: {
      token_score: tokenScore,
      attempt_score: attemptScore,
      time_score: timeScore,
      total: clamp(round(tokenScore + attemptScore + timeScore), 0, 30),
      baseline_source: baseline.source,
    },
    patterns,
    pattern_adjustment: patternAdjustment,
  };
}

async function judgeWithEnsemble(
  taskDefinition: TaskDefinition,
  messages: SessionRow['messages'],
  artifact: string,
  runCount: number = 3,
): Promise<JudgeResult> {
  const config = getEvaluationProviderConfig();
  if (!config.apiKey) return heuristicJudge(messages, artifact);

  const prompt = JSON.stringify({
    task: taskDefinition.metadata.title,
    background: taskDefinition.context.background,
    messages,
    artifact,
  });
  const runs = await Promise.all(
    Array.from({ length: runCount }, async (_, index) => {
      try {
        const response = await createJsonCompletion<{
          clarity?: { score?: number; reason?: string };
          context?: { score?: number; reason?: string };
          recovery?: { score?: number; reason?: string };
          feedback?: { good?: string; improve?: string };
        }>(config, {
          system:
            '당신은 개발자의 AI 협업 과정을 평가하는 채점관입니다. clarity/context/recovery/feedback JSON만 반환하세요.',
          prompt,
          model: config.judgeModel,
          temperature: 0.3,
          maxOutputTokens: 1200,
          seed: index,
        });
        return normalizeJudgeRun(response);
      } catch {
        return null;
      }
    }),
  );
  const successfulRuns = runs.filter((run): run is JudgeRunResult => run !== null);
  if (successfulRuns.length === 0) throw new Error('judge_all_failed');
  const clarityScore = average(successfulRuns.map((run) => run.clarity.score));
  const contextScore = average(successfulRuns.map((run) => run.context.score));
  const recoveryScore = average(successfulRuns.map((run) => run.recovery.score));
  return {
    clarity: {
      score: clarityScore,
      reason: pickReasonForAverage(successfulRuns, 'clarity', clarityScore),
    },
    context: {
      score: contextScore,
      reason: pickReasonForAverage(successfulRuns, 'context', contextScore),
    },
    recovery: {
      score: recoveryScore,
      reason: pickReasonForAverage(successfulRuns, 'recovery', recoveryScore),
    },
    feedback: pickMedianFeedback(successfulRuns),
    raw_runs: successfulRuns,
    inter_run_stddev: {
      clarity: standardDeviation(successfulRuns.map((run) => run.clarity.score)),
      context: standardDeviation(successfulRuns.map((run) => run.context.score)),
      recovery: standardDeviation(successfulRuns.map((run) => run.recovery.score)),
    },
    successful_runs: successfulRuns.length,
  };
}

function aggregate({
  validator,
  taskDefinition,
  quantitative,
  judge,
  task,
  scoreDistribution,
}: {
  validator: ValidatorResult;
  taskDefinition: TaskDefinition;
  quantitative: QuantitativeResult;
  judge: JudgeResult;
  task: { difficulty: 'easy' | 'medium' | 'hard' };
  scoreDistribution: number[];
}): AggregatedResult {
  const difficultyMultiplier = { easy: 1, medium: 1.05, hard: 1.15 }[task.difficulty] ?? 1;
  const correctness = computeCorrectnessScore(validator, taskDefinition);
  const efficiency = round(quantitative.efficiency.total);
  const context = round(judge.context.score * 1.5);
  const recovery = round(judge.recovery.score);
  const clarity = round(judge.clarity.score * 0.5);
  const patternBonus = round(quantitative.pattern_adjustment);
  const totalScore = clamp(
    Math.round(
      (correctness + efficiency + context + recovery + clarity + patternBonus) *
        difficultyMultiplier,
    ),
    0,
    100,
  );
  const judgeMaxStddev = round(
    Math.max(
      judge.inter_run_stddev.clarity,
      judge.inter_run_stddev.context,
      judge.inter_run_stddev.recovery,
    ),
  );
  return {
    total_score: totalScore,
    scores: { correctness, efficiency, context, recovery, clarity, pattern_bonus: patternBonus },
    feedback: judge.feedback,
    percentile: computePercentile(totalScore, scoreDistribution),
    meta: {
      baseline_source: quantitative.efficiency.baseline_source,
      judge_runs_succeeded: judge.successful_runs,
      judge_max_stddev: judgeMaxStddev,
      is_low_confidence:
        judge.successful_runs < 2 ||
        judgeMaxStddev > 2 ||
        quantitative.efficiency.baseline_source === 'default',
      test_results: validator.test_results,
    },
  };
}

function computeCorrectnessScore(
  validator: ValidatorResult,
  taskDefinition: TaskDefinition,
): number {
  if (validator.passed) return 40;

  const requirements = taskDefinition.requirements;
  const totalWeight = requirements.reduce((sum, requirement) => sum + (requirement.weight ?? 1), 0);
  if (totalWeight <= 0) return 0;

  const passedIds = new Set(validator.passed_requirements);
  const failedIds = new Set(validator.failed_requirements.map((requirement) => requirement.id));
  const earnedWeight = requirements.reduce((sum, requirement) => {
    const weight = requirement.weight ?? 1;
    if (passedIds.size > 0) {
      return passedIds.has(requirement.id) ? sum + weight : sum;
    }
    return failedIds.has(requirement.id) ? sum : sum + weight;
  }, 0);

  return round(clamp((earnedWeight / totalWeight) * 40, 0, 40));
}

async function loadBaseline(
  supabase: SupabaseAdmin,
  taskId: string,
  taskDefinition: TaskDefinition,
): Promise<Baseline> {
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

async function loadScoreDistribution(supabase: SupabaseAdmin, taskId: string): Promise<number[]> {
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

async function markEvaluated(supabase: SupabaseAdmin, sessionId: string): Promise<void> {
  await supabase
    .from('sessions')
    .update({ status: 'evaluated', evaluated_at: new Date().toISOString() })
    .eq('id', sessionId);
}

async function markFailed(
  supabase: SupabaseAdmin,
  sessionId: string,
  reason: string,
): Promise<void> {
  await supabase.from('sessions').update({ status: 'failed' }).eq('id', sessionId);
  console.error(`session evaluation failed (${sessionId}): ${reason}`);
}

function normalizeJudgeRun(response: {
  clarity?: { score?: number; reason?: string };
  context?: { score?: number; reason?: string };
  recovery?: { score?: number; reason?: string };
  feedback?: { good?: string; improve?: string };
}): JudgeRunResult {
  return {
    clarity: normalizeDimension(response.clarity, 7),
    context: normalizeDimension(response.context, 7),
    recovery: normalizeDimension(response.recovery, 7),
    feedback: {
      good: response.feedback?.good?.trim() || '핵심 요구사항을 빠르게 좁혀 나간 점이 좋았습니다.',
      improve:
        response.feedback?.improve?.trim() ||
        '처음 프롬프트에 예시와 제약을 더 넣으면 더 적은 턴으로 끝낼 수 있습니다.',
    },
  };
}

function normalizeDimension(
  value: { score?: number; reason?: string } | undefined,
  fallbackScore: number,
): JudgeRunResult['clarity'] {
  const score = typeof value?.score === 'number' ? value.score : fallbackScore;
  return {
    score: clamp(Math.round(score * 10) / 10, 0, 10),
    reason: value?.reason?.trim() || '평가 이유가 제공되지 않았습니다.',
  };
}

function heuristicJudge(messages: SessionRow['messages'], artifact: string): JudgeResult {
  const userMessages = messages.filter((message) => message.role === 'user');
  const avgLength =
    userMessages.length > 0
      ? userMessages.reduce((sum, message) => sum + message.content.length, 0) / userMessages.length
      : 0;
  const implemented = artifact.trim().length > 20 && !/TODO|YOUR_PATTERN_HERE/.test(artifact);
  const clarityScore = clamp(
    round((implemented ? 6.5 : 4.5) + Math.min(avgLength / 40, 2.5)),
    0,
    10,
  );
  const baseRun: JudgeRunResult = {
    clarity: {
      score: clarityScore,
      reason: 'fallback judge가 사용자 요청의 구체성과 결과물 완성도를 기준으로 계산했습니다.',
    },
    context: { score: 6, reason: 'fallback judge가 기본 맥락 활용 점수를 부여했습니다.' },
    recovery: { score: 6, reason: 'fallback judge가 기본 복구 점수를 부여했습니다.' },
    feedback: {
      good: '핵심 요청과 결과물을 연결했습니다.',
      improve: '초기 프롬프트에 예시와 제약을 더 넣으면 반복 횟수를 줄일 수 있습니다.',
    },
  };
  return {
    ...baseRun,
    raw_runs: [baseRun, baseRun, baseRun],
    inter_run_stddev: { clarity: 0, context: 0, recovery: 0 },
    successful_runs: 3,
  };
}

function analyzePatterns(messages: SessionRow['messages']): QuantitativeResult['patterns'] {
  const userMessages = messages.filter((message) => message.role === 'user');
  if (userMessages.length === 0) {
    return {
      redundancy_ratio: 0,
      context_reference_count: 0,
      avg_user_message_length: 0,
      error_recovery_attempts: 0,
    };
  }
  const contextPattern =
    /(그거|그것|위에서|방금|앞서|이전|그 코드|그 함수|수정해|바꿔|추가로|that|previous|above|earlier|the (?:code|function|previous))/gi;
  const errorPattern = /(틀렸|잘못|에러|오류|아니야|다시|wrong|incorrect|error|fix)/gi;
  let redundancyHits = 0;
  for (let index = 1; index < userMessages.length; index += 1) {
    if (jaccardSimilarity(userMessages[index].content, userMessages[index - 1].content) > 0.72) {
      redundancyHits += 1;
    }
  }
  return {
    redundancy_ratio:
      userMessages.length > 1 ? round(redundancyHits / (userMessages.length - 1)) : 0,
    context_reference_count: userMessages.reduce(
      (sum, message) => sum + (message.content.match(contextPattern) || []).length,
      0,
    ),
    avg_user_message_length: round(
      userMessages.reduce((sum, message) => sum + message.content.length, 0) / userMessages.length,
    ),
    error_recovery_attempts: userMessages.filter((message) => errorPattern.test(message.content))
      .length,
  };
}

function computePatternAdjustment(
  patterns: QuantitativeResult['patterns'],
  messageCount: number,
): number {
  let adjustment = 0;
  if (patterns.redundancy_ratio > 0.5) adjustment -= 3;
  else if (patterns.redundancy_ratio > 0.3) adjustment -= 1;
  const contextPerMessage =
    messageCount > 0 ? patterns.context_reference_count / Math.max(messageCount, 1) : 0;
  if (contextPerMessage >= 0.3) adjustment += 2;
  else if (patterns.context_reference_count > 0) adjustment += 1;
  if (patterns.avg_user_message_length < 18) adjustment -= 1;
  if (patterns.error_recovery_attempts >= 2) adjustment += 1;
  return clamp(round(adjustment), -5, 5);
}

function getElapsedSeconds(session: SessionRow): number {
  if (!session.started_at || !session.submitted_at) return 0;
  const diff = new Date(session.submitted_at).getTime() - new Date(session.started_at).getTime();
  return diff > 0 ? Math.round(diff / 1000) : 0;
}

function ratioToScore(baseline: number, actual: number, maxScore: number): number {
  if (baseline <= 0 || actual <= 0) return 0;
  return round(clamp((baseline / actual) * maxScore, 0, maxScore));
}

function jaccardSimilarity(left: string, right: string): number {
  const leftTokens = new Set(left.toLowerCase().split(/\s+/).filter(Boolean));
  const rightTokens = new Set(right.toLowerCase().split(/\s+/).filter(Boolean));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return intersection / union;
}

function pickReasonForAverage(
  runs: JudgeRunResult[],
  key: 'clarity' | 'context' | 'recovery',
  averageScore: number,
): string {
  return runs.reduce(
    (best, run) => {
      const diff = Math.abs(run[key].score - averageScore);
      return diff < best.diff ? { diff, reason: run[key].reason } : best;
    },
    { diff: Number.POSITIVE_INFINITY, reason: runs[0]?.[key].reason ?? '평가 이유가 없습니다.' },
  ).reason;
}

function pickMedianFeedback(runs: JudgeRunResult[]): JudgeRunResult['feedback'] {
  const ranked = [...runs].sort((left, right) => sumScores(left) - sumScores(right));
  return ranked[Math.floor(ranked.length / 2)]?.feedback ?? runs[0].feedback;
}

function sumScores(run: JudgeRunResult): number {
  return run.clarity.score + run.context.score + run.recovery.score;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function standardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(values.length, 1);
  return round(Math.sqrt(variance));
}

function computePercentile(score: number, distribution: number[]): number {
  if (distribution.length === 0) return 50;
  return round((distribution.filter((value) => value < score).length / distribution.length) * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
