import { NextResponse } from 'next/server';
import { parse as parseYaml } from 'yaml';
import type Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@/lib/anthropic/client';
import { buildSystemPrompt, extractCodeBlocks } from '@/lib/challenge';
import type { TaskDefinition } from '@/lib/types/task';
import type {
  SendMessageRequest,
  SendMessageResponse,
  ApiError,
} from '@/lib/api/contracts';

// POST /api/sessions/[id]/messages — Claude 호출 + 메시지 저장
// 사양: docs/06-api-endpoints.md §6.1
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json<ApiError>(
      { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
      { status: 401 },
    );
  }

  let body: SendMessageRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiError>(
      { error: { code: 'INVALID_INPUT', message: '요청 본문이 올바르지 않습니다.' } },
      { status: 400 },
    );
  }

  if (!body.content || typeof body.content !== 'string' || !body.content.trim()) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INVALID_INPUT', message: '메시지 내용이 비어 있습니다.' } },
      { status: 400 },
    );
  }

  // TODO(day8): limits.message (20/min) — Upstash 환경 설정 후 추가.

  // 세션 + 태스크 조회. RLS 가 본인 세션만 허용.
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, status, message_count, tasks(yaml_definition)')
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    return NextResponse.json<ApiError>(
      { error: { code: 'SESSION_INVALID', message: '세션이 유효하지 않습니다.' } },
      { status: 400 },
    );
  }
  if (session.status !== 'in_progress') {
    return NextResponse.json<ApiError>(
      { error: { code: 'SESSION_INVALID', message: '세션이 진행 중이 아닙니다.' } },
      { status: 400 },
    );
  }
  if (session.message_count >= 50) {
    return NextResponse.json<ApiError>(
      {
        error: {
          code: 'MESSAGE_LIMIT_EXCEEDED',
          message: '메시지 한도(50개)에 도달했습니다.',
        },
      },
      { status: 429 },
    );
  }

  // 태스크 YAML 파싱
  type TaskJoin = { yaml_definition: string } | { yaml_definition: string }[] | null;
  const taskJoin = (session as unknown as { tasks: TaskJoin }).tasks;
  const yamlText = Array.isArray(taskJoin)
    ? (taskJoin[0]?.yaml_definition ?? '')
    : (taskJoin?.yaml_definition ?? '');

  let taskDef: TaskDefinition;
  try {
    taskDef = parseYaml(yamlText) as TaskDefinition;
  } catch {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: '태스크 YAML 파싱 실패' } },
      { status: 500 },
    );
  }

  // 이전 대화 로드 (Claude messages 형식으로 변환)
  const { data: history, error: historyError } = await supabase
    .from('messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (historyError) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: historyError.message } },
      { status: 500 },
    );
  }

  // 사용자 메시지 먼저 저장 — Claude 호출이 실패해도 사용자 입력은 보존.
  const { data: userMsg, error: userInsertError } = await supabase
    .from('messages')
    .insert({ session_id: sessionId, role: 'user', content: body.content })
    .select()
    .single();

  if (userInsertError || !userMsg) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: '사용자 메시지 저장 실패' } },
      { status: 500 },
    );
  }

  // Claude 호출
  let aiText = '';
  let inputTokens = 0;
  let outputTokens = 0;
  try {
    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: buildSystemPrompt(taskDef),
      messages: [
        ...(history ?? []).map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: body.content },
      ],
    });

    aiText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');
    inputTokens = response.usage.input_tokens;
    outputTokens = response.usage.output_tokens;
  } catch (err) {
    return NextResponse.json<ApiError>(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : 'AI 응답 생성 실패',
        },
      },
      { status: 500 },
    );
  }

  const codeBlocks = extractCodeBlocks(aiText);

  // AI 메시지 저장 (코드 블록 추출 결과 포함)
  const { data: aiMsg, error: aiInsertError } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      role: 'assistant',
      content: aiText,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      extracted_code_blocks: { blocks: codeBlocks },
    })
    .select()
    .single();

  if (aiInsertError || !aiMsg) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: 'AI 메시지 저장 실패' } },
      { status: 500 },
    );
  }

  // 세션 카운터 증가 (B 의 RPC, Day 1 동기화 항목).
  await supabase.rpc('increment_session_counters', {
    p_session_id: sessionId,
    p_input_tokens: inputTokens,
    p_output_tokens: outputTokens,
  });

  return NextResponse.json<SendMessageResponse>({
    userMessage: userMsg,
    aiMessage: aiMsg,
  });
}
