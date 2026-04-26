import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { MeSessionsItem, MeSessionsResponse, ApiError } from '@/lib/api/contracts';
import type { Difficulty } from '@/lib/types/task';
import type { SessionStatus } from '@/lib/types/session';

// GET /api/me/sessions — 본인 세션 목록 (필터 + 페이지네이션)
// 사양: docs/06-api-endpoints.md:16
export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const statusParam = url.searchParams.get('status') as SessionStatus | null;
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20),
  );
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('sessions')
    .select(
      '*, tasks(id, title, category_slug, difficulty), evaluations(total_score)',
      { count: 'exact' },
    )
    .eq('user_id', user.id)
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

  type TaskJoin = { id: string; title: string; category_slug: string; difficulty: Difficulty };
  type EvalJoin = { total_score: number };
  type Row = Record<string, unknown> & {
    tasks: TaskJoin | TaskJoin[] | null;
    evaluations: EvalJoin | EvalJoin[] | null;
  };

  const sessions: MeSessionsItem[] = (data ?? []).map((row) => {
    const r = row as Row;
    const t = Array.isArray(r.tasks) ? r.tasks[0] : r.tasks;
    const e = Array.isArray(r.evaluations) ? r.evaluations[0] : r.evaluations;
    return {
      ...(r as unknown as MeSessionsItem),
      task: t
        ? { id: t.id, title: t.title, category: t.category_slug, difficulty: t.difficulty }
        : { id: '', title: '(deleted)', category: '', difficulty: 'easy' as Difficulty },
      total_score: e?.total_score ?? null,
    };
  });

  return NextResponse.json<MeSessionsResponse>({
    sessions,
    total: count ?? sessions.length,
    page,
    limit,
  });
}
