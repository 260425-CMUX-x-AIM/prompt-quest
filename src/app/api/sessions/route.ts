import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  ApiError,
} from '@/lib/api/contracts';

// POST /api/sessions — 세션 시작 (사양: 06-api-endpoints.md:7)
// rate limit (sessionStart 10/일) 은 Day 8 에 Upstash 설정 후 추가.
export async function POST(request: Request) {
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

  let body: CreateSessionRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiError>(
      { error: { code: 'INVALID_INPUT', message: '요청 본문이 올바르지 않습니다.' } },
      { status: 400 },
    );
  }

  if (!body.task_slug || typeof body.task_slug !== 'string') {
    return NextResponse.json<ApiError>(
      { error: { code: 'INVALID_INPUT', message: 'task_slug 가 필요합니다.' } },
      { status: 400 },
    );
  }

  // task_id 조회
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id')
    .eq('slug', body.task_slug)
    .maybeSingle();

  if (taskError) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: taskError.message } },
      { status: 500 },
    );
  }
  if (!task) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INVALID_INPUT', message: '태스크를 찾을 수 없습니다.' } },
      { status: 404 },
    );
  }

  const { data: session, error: insertError } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      task_id: task.id,
      status: 'in_progress',
    })
    .select('id')
    .single();

  if (insertError || !session) {
    return NextResponse.json<ApiError>(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: insertError?.message ?? '세션 생성 실패',
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json<CreateSessionResponse>({ session_id: session.id });
}
