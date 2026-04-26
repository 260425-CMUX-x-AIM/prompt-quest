import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

interface GoldenSetCase {
  id: string;
  slug: string;
  input: {
    artifact: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
    elapsed_seconds: number;
    attempt_count: number;
  };
}

function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 환경 변수가 필요합니다.`);
  }

  return value;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const supabaseUrl = assertEnv('SUPABASE_URL');
  const serviceRoleKey = assertEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const fixturePath = join(process.cwd(), 'fixtures', 'evaluation', 'golden-set.json');
  const fixtures = JSON.parse(readFileSync(fixturePath, 'utf-8')) as GoldenSetCase[];
  const smokeCase = fixtures.find((fixture) => fixture.id === 'golden-regex-pass') ?? fixtures[0];
  if (!smokeCase) {
    throw new Error('smoke fixture를 찾지 못했습니다.');
  }

  const smokeEmail = `smoke-${Date.now()}@promptquest.local`;
  const { data: authUserData, error: authUserError } = await supabase.auth.admin.createUser({
    email: smokeEmail,
    email_confirm: true,
    password: `Smoke-${Date.now()}-Pass!`,
  });

  if (authUserError || !authUserData.user) {
    throw new Error(authUserError?.message || 'smoke user 생성에 실패했습니다.');
  }

  const userId = authUserData.user.id;
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id')
    .eq('slug', smokeCase.slug)
    .single();

  if (taskError || !task) {
    throw new Error(taskError?.message || `task ${smokeCase.slug}를 찾지 못했습니다.`);
  }

  const startedAt = new Date(Date.now() - smokeCase.input.elapsed_seconds * 1000).toISOString();
  const submittedAt = new Date().toISOString();

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      task_id: task.id,
      status: 'evaluating',
      started_at: startedAt,
      submitted_at: submittedAt,
      attempt_count: smokeCase.input.attempt_count,
      message_count: smokeCase.input.messages.length,
      total_input_tokens: smokeCase.input.usage.input_tokens,
      total_output_tokens: smokeCase.input.usage.output_tokens,
    })
    .select('id')
    .single();

  if (sessionError || !session) {
    throw new Error(sessionError?.message || 'smoke session 생성에 실패했습니다.');
  }

  const sessionId = session.id;
  const { error: messagesError } = await supabase.from('messages').insert(
    smokeCase.input.messages.map((message, index) => ({
      session_id: sessionId,
      role: message.role,
      content: message.content,
      input_tokens: message.role === 'assistant' ? smokeCase.input.usage.input_tokens : null,
      output_tokens: message.role === 'assistant' ? smokeCase.input.usage.output_tokens : null,
      created_at: new Date(
        Date.now() - (smokeCase.input.messages.length - index) * 1000,
      ).toISOString(),
    })),
  );

  if (messagesError) {
    throw new Error(messagesError.message);
  }

  const { error: artifactError } = await supabase.from('artifacts').insert({
    session_id: sessionId,
    version: 1,
    content: smokeCase.input.artifact,
    language: 'javascript',
    source: 'manual',
    is_final: true,
  });

  if (artifactError) {
    throw new Error(artifactError.message);
  }

  const functionResponse = await fetch(`${supabaseUrl}/functions/v1/evaluate-session`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId }),
  });

  if (!functionResponse.ok) {
    throw new Error(await functionResponse.text());
  }

  for (let attempt = 0; attempt < 25; attempt += 1) {
    await wait(2000);

    const { data: evaluation } = await supabase
      .from('evaluations')
      .select('total_score, validator_passed, meta')
      .eq('session_id', sessionId)
      .maybeSingle();
    const { data: stages } = await supabase
      .from('evaluation_stages')
      .select('stage, status, error_message')
      .eq('session_id', sessionId)
      .order('created_at');
    const { data: latestSession } = await supabase
      .from('sessions')
      .select('status')
      .eq('id', sessionId)
      .single();

    if (latestSession?.status === 'failed') {
      throw new Error(`smoke evaluation failed: ${JSON.stringify(stages ?? [])}`);
    }

    if (latestSession?.status === 'evaluated' && evaluation) {
      console.log(
        JSON.stringify({
          sessionId,
          total_score: evaluation.total_score,
          validator_passed: evaluation.validator_passed,
          stage_count: stages?.length ?? 0,
        }),
      );
      return;
    }
  }

  throw new Error(`smoke evaluation timeout: ${sessionId}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
