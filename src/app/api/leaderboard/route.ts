import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import type { ApiError, PublicAttemptItem, PublicAttemptsResponse } from '@/lib/api/contracts';
import type { Difficulty } from '@/lib/types/task';

type TaskJoin = {
  id: string;
  slug: string;
  title: string;
  category_slug: string;
  difficulty: Difficulty;
};

type ProfileJoin = {
  username: string;
  display_name: string | null;
};

type SessionJoin = {
  id: string;
  started_at: string;
  evaluated_at: string | null;
  attempt_count: number;
  message_count: number;
  total_input_tokens: number;
  total_output_tokens: number;
  tasks: TaskJoin | TaskJoin[] | null;
  profiles: ProfileJoin | ProfileJoin[] | null;
};

type EvaluationRow = {
  session_id: string;
  total_score: number | null;
  percentile: number | null;
  sessions: SessionJoin | SessionJoin[] | null;
};

type PromptRow = {
  session_id: string;
  content: string;
  created_at: string;
};

function firstJoin<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// GET /api/leaderboard — 공개 우수 풀이/프롬프트 피드
export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(
    30,
    Math.max(1, parseInt(url.searchParams.get('limit') ?? '10', 10) || 10),
  );
  const from = (page - 1) * limit;
  const to = from + limit - 1;

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

  const { data, count, error } = await supabase
    .from('evaluations')
    .select(
      `
      session_id,
      total_score,
      percentile,
      sessions!inner(
        id,
        started_at,
        evaluated_at,
        attempt_count,
        message_count,
        total_input_tokens,
        total_output_tokens,
        status,
        tasks!inner(id, slug, title, category_slug, difficulty),
        profiles!inner(username, display_name)
      )
    `,
      { count: 'exact' },
    )
    .eq('sessions.status', 'evaluated')
    .not('total_score', 'is', null)
    .order('total_score', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as EvaluationRow[];
  const sessionIds = rows.map((row) => row.session_id);
  const promptsBySession = new Map<string, string[]>();

  if (sessionIds.length > 0) {
    const { data: promptRows, error: promptError } = await supabase
      .from('messages')
      .select('session_id, content, created_at')
      .in('session_id', sessionIds)
      .eq('role', 'user')
      .order('created_at', { ascending: true });

    if (promptError) {
      return NextResponse.json<ApiError>(
        { error: { code: 'INTERNAL_ERROR', message: promptError.message } },
        { status: 500 },
      );
    }

    for (const prompt of (promptRows ?? []) as PromptRow[]) {
      const prompts = promptsBySession.get(prompt.session_id) ?? [];
      if (prompts.length < 2) {
        promptsBySession.set(prompt.session_id, [...prompts, prompt.content]);
      }
    }
  }

  const attempts: PublicAttemptItem[] = rows.flatMap((row) => {
    const session = firstJoin(row.sessions);
    const task = session ? firstJoin(session.tasks) : null;
    const profile = session ? firstJoin(session.profiles) : null;
    if (!session || !task || !profile || row.total_score == null) return [];

    return [
      {
        session_id: row.session_id,
        user: {
          username: profile.username,
          display_name: profile.display_name,
        },
        task: {
          id: task.id,
          slug: task.slug,
          title: task.title,
          category: task.category_slug,
          difficulty: task.difficulty,
        },
        score: row.total_score,
        percentile: row.percentile,
        prompts: promptsBySession.get(row.session_id) ?? [],
        started_at: session.started_at,
        evaluated_at: session.evaluated_at,
        attempt_count: session.attempt_count,
        message_count: session.message_count,
        total_tokens: session.total_input_tokens + session.total_output_tokens,
      },
    ];
  });

  return NextResponse.json<PublicAttemptsResponse>({
    attempts,
    total: count ?? attempts.length,
    page,
    limit,
  });
}
