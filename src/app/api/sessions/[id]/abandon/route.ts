import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AbandonResponse, ApiError } from '@/lib/api/contracts';

// POST /api/sessions/[id]/abandon — 세션 포기 (사양: 06-api-endpoints.md:13)
export async function POST(
  _request: Request,
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

  const { data: session } = await supabase
    .from('sessions')
    .select('id, status, user_id')
    .eq('id', sessionId)
    .maybeSingle();

  if (!session || session.user_id !== user.id) {
    return NextResponse.json<ApiError>(
      { error: { code: 'FORBIDDEN', message: '세션을 찾을 수 없습니다.' } },
      { status: 404 },
    );
  }
  if (session.status !== 'in_progress') {
    return NextResponse.json<ApiError>(
      { error: { code: 'SESSION_INVALID', message: '진행 중인 세션이 아닙니다.' } },
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase
    .from('sessions')
    .update({ status: 'abandoned' })
    .eq('id', sessionId);

  if (updateError) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: updateError.message } },
      { status: 500 },
    );
  }

  return NextResponse.json<AbandonResponse>({ status: 'abandoned' });
}
