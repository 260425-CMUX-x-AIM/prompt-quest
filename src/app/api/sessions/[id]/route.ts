import { NextResponse } from 'next/server';
import { parse as parseYaml } from 'yaml';
import { createClient } from '@/lib/supabase/server';
import type { GetSessionResponse, ApiError } from '@/lib/api/contracts';
import type { TaskDefinition } from '@/lib/types/task';

// GET /api/sessions/[id] — 세션 상세 (메시지·결과물·태스크 포함)
// 사양: 06-api-endpoints.md:8. RLS 가 본인 세션만 허용.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

  // 세션 + 태스크 yaml 동시 조회
  const { data: sessionRow, error: sessionError } = await supabase
    .from('sessions')
    .select('*, tasks(yaml_definition)')
    .eq('id', id)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: sessionError.message } },
      { status: 500 },
    );
  }
  if (!sessionRow) {
    return NextResponse.json<ApiError>(
      { error: { code: 'FORBIDDEN', message: '세션이 없거나 접근 권한이 없습니다.' } },
      { status: 404 },
    );
  }

  // 메시지·결과물 병렬 페치
  const [messagesRes, artifactsRes] = await Promise.all([
    supabase
      .from('messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('artifacts')
      .select('*')
      .eq('session_id', id)
      .order('version', { ascending: true }),
  ]);

  if (messagesRes.error) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: messagesRes.error.message } },
      { status: 500 },
    );
  }
  if (artifactsRes.error) {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: artifactsRes.error.message } },
      { status: 500 },
    );
  }

  // 태스크 YAML 파싱
  type TaskJoin = { yaml_definition: string } | { yaml_definition: string }[] | null;
  const taskJoin = (sessionRow as { tasks: TaskJoin }).tasks;
  const yamlText = Array.isArray(taskJoin)
    ? (taskJoin[0]?.yaml_definition ?? '')
    : (taskJoin?.yaml_definition ?? '');

  let taskDef: TaskDefinition;
  try {
    taskDef = parseYaml(yamlText) as TaskDefinition;
  } catch {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: '태스크 YAML 파싱 실패' } },
      { status: 500 },
    );
  }

  // tasks 조인 필드 제거 후 Session 형태로 반환
  const { tasks: _tasks, ...session } = sessionRow as { tasks: TaskJoin } & GetSessionResponse['session'];

  return NextResponse.json<GetSessionResponse>({
    session,
    messages: messagesRes.data ?? [],
    artifacts: artifactsRes.data ?? [],
    task: {
      metadata: taskDef.metadata,
      context: taskDef.context,
      requirements: taskDef.requirements,
      artifact_format: taskDef.artifact_format,
      test_cases: taskDef.test_cases,
      constraints: taskDef.constraints,
    },
  });
}
