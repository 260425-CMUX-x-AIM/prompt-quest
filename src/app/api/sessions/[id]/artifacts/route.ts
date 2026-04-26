import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type {
  CreateArtifactRequest,
  CreateArtifactResponse,
  ApiError,
} from '@/lib/api/contracts';

// POST /api/sessions/[id]/artifacts — AI 응답 코드 블록 → 결과물 신규 INSERT.
// 사양: docs/06-api-endpoints.md:10
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

  let body: CreateArtifactRequest;
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
      { error: { code: 'INVALID_INPUT', message: '결과물 내용이 비어 있습니다.' } },
      { status: 400 },
    );
  }
  if (body.source !== 'ai_extracted') {
    return NextResponse.json<ApiError>(
      { error: { code: 'INVALID_INPUT', message: 'source 가 잘못되었습니다.' } },
      { status: 400 },
    );
  }

  // 세션 검증 (RLS 가 본인 세션만 허용)
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, status')
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

  // 다음 version 계산
  const { data: latest } = await supabase
    .from('artifacts')
    .select('version')
    .eq('session_id', sessionId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = (latest?.version ?? 0) + 1;

  const { data: artifact, error: insertError } = await supabase
    .from('artifacts')
    .insert({
      session_id: sessionId,
      version: nextVersion,
      content: body.content,
      language: body.language ?? null,
      source: 'ai_extracted',
      is_final: false,
    })
    .select()
    .single();

  if (insertError || !artifact) {
    return NextResponse.json<ApiError>(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: insertError?.message ?? '결과물 저장 실패',
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json<CreateArtifactResponse>({ artifact });
}
