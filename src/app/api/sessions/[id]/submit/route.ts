import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runSessionEvaluationPipeline } from '@/lib/evaluation/session-pipeline';
import type { SubmitRequest, SubmitResponse, ApiError } from '@/lib/api/contracts';

// POST /api/sessions/[id]/submit — 결과물 제출 + 프로젝트 내부 Route Handler 채점 실행.
// 사양: docs/06-api-endpoints.md §6.2
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
    .select('id, session_id, is_final, sessions!inner(user_id, status, attempt_count)')
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
    | { user_id: string; status: string; attempt_count: number }
    | { user_id: string; status: string; attempt_count: number }[]
    | null;
  const sessionsJoin = (artifact as unknown as { sessions: SessionJoin }).sessions;
  const sessionInfo = Array.isArray(sessionsJoin) ? sessionsJoin[0] : sessionsJoin;

  if (!sessionInfo || sessionInfo.user_id !== user.id) {
    return NextResponse.json<ApiError>(
      { error: { code: 'FORBIDDEN', message: '권한이 없습니다.' } },
      { status: 403 },
    );
  }
  if (sessionInfo.status === 'evaluating' || sessionInfo.status === 'evaluated') {
    return NextResponse.json<SubmitResponse>({
      status: 'evaluating',
      estimated_seconds: 30,
    });
  }
  if (sessionInfo.status !== 'in_progress' && sessionInfo.status !== 'failed') {
    return NextResponse.json<ApiError>(
      { error: { code: 'SESSION_INVALID', message: '세션이 진행 중이 아닙니다.' } },
      { status: 400 },
    );
  }

  const previousStatus = sessionInfo.status;

  if (previousStatus === 'in_progress') {
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
  } else {
    // 이전 제출에서 Edge Function 트리거만 실패한 세션은 같은 결과물로 재시도 가능하게 복구한다.
    await supabase.from('artifacts').update({ is_final: false }).eq('session_id', sessionId);
    const { error: finalArtifactError } = await supabase
      .from('artifacts')
      .update({ is_final: true })
      .eq('id', body.artifact_id)
      .eq('session_id', sessionId);
    const { error: retryStatusError } = await supabase
      .from('sessions')
      .update({ status: 'evaluating', submitted_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (finalArtifactError || retryStatusError) {
      return NextResponse.json<ApiError>(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: finalArtifactError?.message ?? retryStatusError?.message ?? '재제출 준비 실패',
          },
        },
        { status: 500 },
      );
    }
  }

  // 채점 실행. 시작/실행 실패는 사용자가 다시 제출할 수 있도록 in_progress 로 되돌린다.
  try {
    await runSessionEvaluationPipeline(sessionId);
  } catch (err) {
    const rollback: Record<string, string | number | null> = {
      status: 'in_progress',
      submitted_at: null,
    };
    if (previousStatus === 'in_progress') {
      rollback.attempt_count = Math.max(0, sessionInfo.attempt_count - 1);
    }
    await supabase.from('sessions').update(rollback).eq('id', sessionId);
    return NextResponse.json<ApiError>(
      {
        error: {
          code: 'EVALUATION_FAILED',
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
