import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EvaluationResponse, ApiError } from '@/lib/api/contracts';
import type { AggregatedResult, EvaluationStage } from '@/lib/types/evaluation';

function isAggregatedResult(value: unknown): value is AggregatedResult {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<AggregatedResult>;
  return (
    typeof candidate.total_score === 'number' &&
    !!candidate.scores &&
    !!candidate.feedback &&
    typeof candidate.percentile === 'number' &&
    !!candidate.meta
  );
}

// GET /api/sessions/[id]/evaluation — 채점 결과 조회 (Realtime fallback 폴링용)
// 사양: docs/06-api-endpoints.md:14
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, status')
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    return NextResponse.json<ApiError>(
      { error: { code: 'FORBIDDEN', message: '세션을 찾을 수 없습니다.' } },
      { status: 404 },
    );
  }

  const [evaluationRes, stagesRes] = await Promise.all([
    supabase.from('evaluations').select('*').eq('session_id', sessionId).maybeSingle(),
    supabase
      .from('evaluation_stages')
      .select('*')
      .eq('session_id', sessionId)
      .order('stage', { ascending: true }),
  ]);

  if (evaluationRes.error) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: evaluationRes.error.message } },
      { status: 500 },
    );
  }
  if (stagesRes.error) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: stagesRes.error.message } },
      { status: 500 },
    );
  }

  let status: EvaluationResponse['status'] = 'evaluating';
  if (session.status === 'evaluated') status = 'evaluated';
  else if (session.status === 'failed') status = 'failed';

  const evaluation = isAggregatedResult(evaluationRes.data) ? evaluationRes.data : null;

  return NextResponse.json<EvaluationResponse>({
    status,
    evaluation: status === 'evaluated' ? evaluation : null,
    stages: (stagesRes.data ?? []) as EvaluationStage[],
  });
}
