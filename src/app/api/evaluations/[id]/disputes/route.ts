import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type {
  CreateDisputeRequest,
  CreateDisputeResponse,
  ApiError,
  DisputeReason,
} from '@/lib/api/contracts';

const VALID_REASONS: ReadonlyArray<DisputeReason> = [
  'score_too_low',
  'score_too_high',
  'bad_feedback',
  'other',
];

// POST /api/evaluations/[id]/disputes — 분쟁 신청
// 사양: docs/06-api-endpoints.md:15, docs/05-database-schema.md `evaluation_disputes`
// MVP 호환: param 의 [id] 가 evaluation_id 또는 session_id 둘 다 허용 (results 페이지가 evaluation row id 를 노출하지 않음)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = await params;
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

  let body: CreateDisputeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiError>(
      { error: { code: 'INVALID_INPUT', message: '요청 본문이 올바르지 않습니다.' } },
      { status: 400 },
    );
  }
  if (!VALID_REASONS.includes(body.reason)) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INVALID_INPUT', message: '사유가 잘못되었습니다.' } },
      { status: 400 },
    );
  }
  if (body.user_comment != null && typeof body.user_comment !== 'string') {
    return NextResponse.json<ApiError>(
      { error: { code: 'INVALID_INPUT', message: '의견 형식이 잘못되었습니다.' } },
      { status: 400 },
    );
  }

  // evaluation_id 해석: paramId 가 evaluation.id 거나 session_id.
  const { data: evalRow, error: evalError } = await supabase
    .from('evaluations')
    .select('id, session_id, sessions!inner(user_id)')
    .or(`id.eq.${paramId},session_id.eq.${paramId}`)
    .maybeSingle();

  if (evalError || !evalRow) {
    return NextResponse.json<ApiError>(
      { error: { code: 'FORBIDDEN', message: '평가를 찾을 수 없습니다.' } },
      { status: 404 },
    );
  }

  type SessionJoin = { user_id: string } | { user_id: string }[] | null;
  const sessJoin = (evalRow as unknown as { sessions: SessionJoin }).sessions;
  const sessOwner = Array.isArray(sessJoin) ? sessJoin[0] : sessJoin;
  if (!sessOwner || sessOwner.user_id !== user.id) {
    return NextResponse.json<ApiError>(
      { error: { code: 'FORBIDDEN', message: '권한이 없습니다.' } },
      { status: 403 },
    );
  }

  const { data: dispute, error: insertError } = await supabase
    .from('evaluation_disputes')
    .insert({
      evaluation_id: evalRow.id,
      user_id: user.id,
      reason: body.reason,
      user_comment: body.user_comment ?? null,
    })
    .select('id, status')
    .single();

  if (insertError || !dispute) {
    return NextResponse.json<ApiError>(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: insertError?.message ?? '분쟁 신청 저장 실패',
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json<CreateDisputeResponse>({
    dispute_id: dispute.id,
    status: 'pending',
  });
}
