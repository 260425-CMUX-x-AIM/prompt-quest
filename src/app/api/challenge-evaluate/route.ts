import { NextResponse } from 'next/server';
import { runEvaluationPipeline } from '@/lib/evaluation';
import type { EvaluationInput } from '@/lib/evaluation/types';

function isEvaluationInput(value: unknown): value is EvaluationInput {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<EvaluationInput>;
  return (
    typeof candidate.slug === 'string' &&
    typeof candidate.artifact === 'string' &&
    Array.isArray(candidate.messages) &&
    typeof candidate.usage === 'object'
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '요청 본문이 올바른 JSON이 아닙니다.' }, { status: 400 });
  }

  if (!isEvaluationInput(body)) {
    return NextResponse.json({ error: '채점 요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  const normalizedBody = body as EvaluationInput & {
    usage: EvaluationInput['usage'] & { inputTokens?: number; outputTokens?: number };
    elapsedSeconds?: number;
    attemptCount?: number;
  };

  const input: EvaluationInput = {
    slug: normalizedBody.slug,
    artifact: normalizedBody.artifact.trim(),
    messages: normalizedBody.messages
      .filter(
        (message): message is EvaluationInput['messages'][number] =>
          !!message &&
          (message.role === 'user' || message.role === 'assistant') &&
          typeof message.content === 'string' &&
          message.content.trim().length > 0,
      )
      .map((message) => ({
        role: message.role,
        content: message.content.trim(),
      })),
    usage: {
      input_tokens: normalizedBody.usage.input_tokens ?? normalizedBody.usage.inputTokens ?? 0,
      output_tokens: normalizedBody.usage.output_tokens ?? normalizedBody.usage.outputTokens ?? 0,
    },
    elapsed_seconds: normalizedBody.elapsed_seconds ?? normalizedBody.elapsedSeconds ?? 0,
    attempt_count: normalizedBody.attempt_count ?? normalizedBody.attemptCount ?? 1,
  };

  if (!input.artifact) {
    return NextResponse.json({ error: '최종 산출물이 비어 있습니다.' }, { status: 400 });
  }

  if (input.messages.length === 0) {
    return NextResponse.json({ error: '평가할 대화 내역이 없습니다.' }, { status: 400 });
  }

  try {
    const result = await runEvaluationPipeline(input);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '채점 파이프라인 실행 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
