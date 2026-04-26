import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type {
  UpdateArtifactRequest,
  UpdateArtifactResponse,
  ApiError,
} from '@/lib/api/contracts';

// PATCH /api/sessions/[id]/artifacts/[artifactId] — 사용자 인라인 편집.
// 사양: docs/06-api-endpoints.md:11
// MVP UI 입력은 'user_edited' / 'ai_extracted' 만 허용 (DB enum 의 'manual' 은 v1.5).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; artifactId: string }> },
) {
  const { id: sessionId, artifactId } = await params;
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

  let body: UpdateArtifactRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiError>(
      { error: { code: 'INVALID_INPUT', message: '요청 본문이 올바르지 않습니다.' } },
      { status: 400 },
    );
  }

  if (typeof body.content !== 'string') {
    return NextResponse.json<ApiError>(
      { error: { code: 'INVALID_INPUT', message: 'content 가 필요합니다.' } },
      { status: 400 },
    );
  }
  if (body.source !== 'user_edited' && body.source !== 'ai_extracted') {
    return NextResponse.json<ApiError>(
      { error: { code: 'INVALID_INPUT', message: 'source 가 잘못되었습니다.' } },
      { status: 400 },
    );
  }

  // 세션 검증
  const { data: session } = await supabase
    .from('sessions')
    .select('id, status')
    .eq('id', sessionId)
    .maybeSingle();

  if (!session) {
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

  const { data: artifact, error: updateError } = await supabase
    .from('artifacts')
    .update({
      content: body.content,
      source: body.source,
    })
    .eq('id', artifactId)
    .eq('session_id', sessionId)
    .select()
    .single();

  if (updateError || !artifact) {
    return NextResponse.json<ApiError>(
      { error: { code: 'FORBIDDEN', message: '결과물을 찾을 수 없습니다.' } },
      { status: 404 },
    );
  }

  return NextResponse.json<UpdateArtifactResponse>({ artifact });
}
