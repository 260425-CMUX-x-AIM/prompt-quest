import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SubmitRequest, SubmitResponse, ApiError } from '@/lib/api/contracts';

// POST /api/sessions/[id]/submit — 결과물 제출 + B 의 evaluate-session Edge Function 트리거.
// 사양: docs/06-api-endpoints.md §6.2
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

  let body: SubmitRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiError>(
      { error: { code: 'INVALID_INPUT', message: '요청 본문이 올바르지 않습니다.' } },
      { status: 400 },
    );
  }
  if (!body.artifact_id || typeof body.artifact_id !== 'string') {
    return NextResponse.json<ApiError>(
      { error: { code: 'INVALID_INPUT', message: 'artifact_id 가 필요합니다.' } },
      { status: 400 },
    );
  }

  // artifact + 세션 ownership 검증
  const { data: artifact, error: artifactError } = await supabase
    .from('artifacts')
    .select('id, session_id, sessions!inner(user_id, status)')
    .eq('id', body.artifact_id)
    .eq('session_id', sessionId)
    .maybeSingle();

  if (artifactError || !artifact) {
    return NextResponse.json<ApiError>(
      { error: { code: 'FORBIDDEN', message: '결과물을 찾을 수 없습니다.' } },
      { status: 404 },
    );
  }

  type SessionJoin =
    | { user_id: string; status: string }
    | { user_id: string; status: string }[]
    | null;
  const sessionsJoin = (artifact as unknown as { sessions: SessionJoin }).sessions;
  const sessionInfo = Array.isArray(sessionsJoin) ? sessionsJoin[0] : sessionsJoin;

  if (!sessionInfo || sessionInfo.user_id !== user.id) {
    return NextResponse.json<ApiError>(
      { error: { code: 'FORBIDDEN', message: '권한이 없습니다.' } },
      { status: 403 },
    );
  }
  if (sessionInfo.status !== 'in_progress') {
    return NextResponse.json<ApiError>(
      { error: { code: 'SESSION_INVALID', message: '세션이 진행 중이 아닙니다.' } },
      { status: 400 },
    );
  }

  // submit_artifact RPC: sessions.status='evaluating', artifacts.is_final=true
  const { error: submitError } = await supabase.rpc('submit_artifact', {
    p_session_id: sessionId,
    p_artifact_id: body.artifact_id,
  });

  if (submitError) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: submitError.message } },
      { status: 500 },
    );
  }

  // Edge Function 트리거. 실패 시 status 롤백 (검토 #6).
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 미설정');
    }

    const fnRes = await fetch(`${supabaseUrl}/functions/v1/evaluate-session`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!fnRes.ok) {
      await supabase.from('sessions').update({ status: 'failed' }).eq('id', sessionId);
      return NextResponse.json<ApiError>(
        { error: { code: 'INTERNAL_ERROR', message: '채점 시작 실패' } },
        { status: 500 },
      );
    }
  } catch (err) {
    await supabase.from('sessions').update({ status: 'failed' }).eq('id', sessionId);
    return NextResponse.json<ApiError>(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : '채점 시작 실패',
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json<SubmitResponse>({
    status: 'evaluating',
    estimated_seconds: 30,
  });
}
