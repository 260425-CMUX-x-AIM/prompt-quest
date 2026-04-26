import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { getServerAiConfig } from '@/lib/ai-provider.server';
import { extractCodeBlocks } from '@/lib/challenge';
import type { SendMessageRequest, SendMessageResponse, ApiError } from '@/lib/api/contracts';

type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const BLIND_ASSISTANT_PROMPT =
  '당신은 사용자의 지시만 보고 돕는 AI 어시스턴트입니다. 현재 화면의 문제, 요구사항, 채점 기준은 알 수 없습니다. 사용자가 제공한 정보 안에서만 답하고, 필요한 정보가 부족하면 문제 내용이나 요구사항을 붙여 달라고 요청하세요. 답변은 한국어로 간결하고 실용적으로 작성하세요.';

async function generateAssistantMessage({
  messages,
}: {
  messages: ConversationMessage[];
}): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const aiConfig = getServerAiConfig();
  if (!aiConfig.apiKey) {
    throw new Error(`${aiConfig.apiKeyEnvName}가 설정되지 않았습니다.`);
  }

  if (aiConfig.provider === 'gemini') {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': aiConfig.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: BLIND_ASSISTANT_PROMPT }],
          },
          contents: messages.map((message) => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content }],
          })),
          generationConfig: {
            maxOutputTokens: 4096,
          },
        }),
      },
    );

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      promptFeedback?: { blockReason?: string };
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
      };
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new Error(data.error?.message || `${aiConfig.displayName} API 호출 실패`);
    }
    if (data.promptFeedback?.blockReason) {
      throw new Error(
        `${aiConfig.displayName}가 요청을 차단했습니다: ${data.promptFeedback.blockReason}`,
      );
    }

    const content = data.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text ?? '')
      .join('\n')
      .trim();

    if (!content) {
      throw new Error(`${aiConfig.displayName} 응답에서 텍스트를 찾지 못했습니다.`);
    }

    return {
      content,
      inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
    };
  }

  const anthropic = new Anthropic({ apiKey: aiConfig.apiKey });
  const response = await anthropic.messages.create({
    model: aiConfig.model,
    max_tokens: 4096,
    system: BLIND_ASSISTANT_PROMPT,
    messages,
  });

  const content = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (!content) {
    throw new Error(`${aiConfig.displayName} 응답에서 텍스트를 찾지 못했습니다.`);
  }

  return {
    content,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

// POST /api/sessions/[id]/messages — Claude 호출 + 메시지 저장
// 사양: docs/06-api-endpoints.md §6.1
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  // 세션 조회. RLS 가 본인 세션만 허용.
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, status, message_count')
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
    const completion = await generateAssistantMessage({
      messages: [
        ...(history ?? [])
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        { role: 'user', content: body.content },
      ],
    });
    aiText = completion.content;
    inputTokens = completion.inputTokens;
    outputTokens = completion.outputTokens;
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
