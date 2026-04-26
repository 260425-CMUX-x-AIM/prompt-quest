import { NextResponse } from 'next/server';
import { parse as parseYaml } from 'yaml';
import { createClient } from '@/lib/supabase/server';
import type { GetTaskResponse, ApiError } from '@/lib/api/contracts';
import type { TaskDefinition } from '@/lib/types/task';

// GET /api/tasks/[slug] — 태스크 상세 + YAML 파싱 (사양: 06-api-endpoints.md:6)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tasks')
    .select(
      'id, slug, title, category_slug, difficulty, estimated_minutes, yaml_definition',
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INVALID_INPUT', message: '태스크를 찾을 수 없습니다.' } },
      { status: 404 },
    );
  }

  let taskDef: TaskDefinition;
  try {
    taskDef = parseYaml(data.yaml_definition) as TaskDefinition;
  } catch {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: '태스크 YAML 파싱 실패' } },
      { status: 500 },
    );
  }

  return NextResponse.json<GetTaskResponse>({
    task: {
      id: data.id,
      slug: data.slug,
      title: data.title,
      category_slug: data.category_slug,
      difficulty: data.difficulty,
      estimated_minutes: data.estimated_minutes,
      metadata: taskDef.metadata,
      context: taskDef.context,
      requirements: taskDef.requirements,
      artifact_format: taskDef.artifact_format,
      constraints: taskDef.constraints,
    },
  });
}
