import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ListTasksResponse, ApiError, TaskListItem } from '@/lib/api/contracts';

// GET /api/tasks — 태스크 목록 (사양: 06-api-endpoints.md:5)
export async function GET() {
  const supabase = await createClient();

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

  return NextResponse.json<ListTasksResponse>({
    tasks: (data ?? []) as TaskListItem[],
  });
}
