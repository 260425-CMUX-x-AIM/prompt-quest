import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import type {
  ApiError,
  MeSessionsItem,
  UserSessionsResponse,
} from '@/lib/api/contracts';
import type { Difficulty } from '@/lib/types/task';
import type { SessionStatus } from '@/lib/types/session';

type TaskJoin = { id: string; title: string; category_slug: string; difficulty: Difficulty };
type EvalJoin = { total_score: number };
type SessionRow = Record<string, unknown> & {
  tasks: TaskJoin | TaskJoin[] | null;
  evaluations: EvalJoin | EvalJoin[] | null;
};

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  let supabase;
  try {
    supabase = getSupabaseAdminClient();
  } catch (error) {
    return NextResponse.json<ApiError>(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '관리자 클라이언트 생성 실패',
        },
      },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get('status') as SessionStatus | null;
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20),
  );
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('username', username)
    .single();

  if (profileError || !profile) {
    return NextResponse.json<ApiError>(
      { error: { code: 'NOT_FOUND', message: '프로필을 찾을 수 없습니다.' } },
      { status: 404 },
    );
  }

  let query = supabase
    .from('sessions')
    .select('*, tasks(id, title, category_slug, difficulty), evaluations(total_score)', {
      count: 'exact',
    })
    .eq('user_id', profile.id)
    .order('started_at', { ascending: false })
    .range(from, to);

  if (statusParam) query = query.eq('status', statusParam);

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }

  const sessions: MeSessionsItem[] = (data ?? []).map((row) => {
    const record = row as SessionRow;
    const task = Array.isArray(record.tasks) ? record.tasks[0] : record.tasks;
    const evaluation = Array.isArray(record.evaluations)
      ? record.evaluations[0]
      : record.evaluations;

    return {
      ...(record as unknown as MeSessionsItem),
      task: task
        ? {
            id: task.id,
            title: task.title,
            category: task.category_slug,
            difficulty: task.difficulty,
          }
        : { id: '', title: '(deleted)', category: '', difficulty: 'easy' as Difficulty },
      total_score: evaluation?.total_score ?? null,
    };
  });

  return NextResponse.json<UserSessionsResponse>({
    profile,
    sessions,
    total: count ?? sessions.length,
    page,
    limit,
  });
}
