import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ListTasksResponse, ApiError, TaskListItem } from '@/lib/api/contracts';
import type { SessionStatus } from '@/lib/types/session';

// GET /api/tasks — 태스크 목록 (사양: 06-api-endpoints.md:5)
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('tasks')
    .select('id, slug, title, category_slug, difficulty, estimated_minutes')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }

  const tasks = (data ?? []) as TaskListItem[];

  if (!user || tasks.length === 0) {
    return NextResponse.json<ListTasksResponse>({ tasks });
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('task_id, status, started_at, evaluations(total_score)')
    .eq('user_id', user.id);

  if (sessionsError) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: sessionsError.message } },
      { status: 500 },
    );
  }

  type EvalJoin = { total_score: number | null };
  type SessionRow = {
    task_id: string;
    status: SessionStatus;
    started_at: string;
    evaluations: EvalJoin | EvalJoin[] | null;
  };
  const progressByTask = new Map<
    string,
    {
      attempt_count: number;
      completed_count: number;
      best_score: number | null;
      last_status: SessionStatus | null;
      last_started_at: string | null;
    }
  >();

  for (const row of (sessions ?? []) as SessionRow[]) {
    const current = progressByTask.get(row.task_id) ?? {
      attempt_count: 0,
      completed_count: 0,
      best_score: null,
      last_status: null,
      last_started_at: null,
    };
    const evaluation = Array.isArray(row.evaluations) ? row.evaluations[0] : row.evaluations;
    const score = evaluation?.total_score ?? null;

    current.attempt_count += 1;
    if (row.status === 'evaluated') current.completed_count += 1;
    if (score != null) current.best_score = Math.max(current.best_score ?? score, score);
    if (!current.last_started_at || row.started_at > current.last_started_at) {
      current.last_status = row.status;
      current.last_started_at = row.started_at;
    }
    progressByTask.set(row.task_id, current);
  }

  return NextResponse.json<ListTasksResponse>({
    tasks: tasks.map((task) => {
      const progress = progressByTask.get(task.id);
      if (!progress) return task;

      return {
        ...task,
        progress: {
          attempt_count: progress.attempt_count,
          completed_count: progress.completed_count,
          best_score: progress.best_score,
          last_status: progress.last_status,
        },
      };
    }),
  });
}
