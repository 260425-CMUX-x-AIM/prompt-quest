# 6. API 엔드포인트 설계

| 메서드 | 경로                                        | 담당  | 설명                    |
| ------ | ------------------------------------------- | ----- | ----------------------- |
| GET    | `/api/tasks`                                | A     | 태스크 목록 (필터링)    |
| GET    | `/api/tasks/[slug]`                         | A     | 태스크 상세             |
| POST   | `/api/sessions`                             | A     | 세션 시작               |
| GET    | `/api/sessions/[id]`                        | A     | 세션 상세 (메시지 포함) |
| POST   | `/api/sessions/[id]/messages`               | A     | AI 프롬프트 전송        |
| POST   | `/api/sessions/[id]/artifacts`              | A     | 결과물 추가             |
| PATCH  | `/api/sessions/[id]/artifacts/[artifactId]` | A     | 결과물 편집             |
| POST   | `/api/sessions/[id]/submit`                 | A → B | 최종 제출 + 채점 트리거 |
| POST   | `/api/sessions/[id]/abandon`                | A     | 포기 처리               |
| GET    | `/api/sessions/[id]/evaluation`             | A     | 채점 결과 조회          |
| POST   | `/api/evaluations/[id]/disputes`            | B     | 분쟁 신청               |
| GET    | `/api/me/sessions`                          | A     | 내 히스토리             |

API 요청/응답 타입은 [3.4](./03-team-split.md#34-인터페이스-계약-day-1-합의-사항)의 `lib/api/contracts.ts` 참고.

## 6.1 메시지 전송 API (개발자 A 담당)

```ts
// app/api/sessions/[id]/messages/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';
import { parse as parseYaml } from 'yaml';
import { buildSystemPrompt, extractCodeBlocks } from '@/lib/challenge';
import { limits } from '@/lib/rate-limit';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const { content } = await req.json();
  if (typeof content !== 'string' || content.trim().length === 0) {
    return Response.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 });
  }

  // Rate limit
  const { success } = await limits.message.limit(user.id);
  if (!success) {
    return Response.json({ error: { code: 'RATE_LIMITED' } }, { status: 429 });
  }

  // 세션 검증
  const { data: session, error } = await supabase
    .from('sessions')
    .select('*, tasks(yaml_definition)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !session || session.status !== 'in_progress') {
    return Response.json({ error: { code: 'SESSION_INVALID' } }, { status: 400 });
  }

  if (session.message_count >= 50) {
    return Response.json({ error: { code: 'MESSAGE_LIMIT_EXCEEDED' } }, { status: 429 });
  }

  // 이전 대화 로드
  const { data: history } = await supabase
    .from('messages')
    .select('role, content')
    .eq('session_id', params.id)
    .order('created_at');

  // 사용자 메시지 저장
  const { data: userMsg } = await supabase
    .from('messages')
    .insert({ session_id: params.id, role: 'user', content })
    .select()
    .single();

  // Claude API 호출
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const taskDef = parseYaml(session.tasks.yaml_definition);

  const aiResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: buildSystemPrompt(taskDef),
    messages: [
      ...(history ?? []).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content },
    ],
  });

  const responseText = aiResponse.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  const codeBlocks = extractCodeBlocks(responseText);

  const { data: aiMsg } = await supabase
    .from('messages')
    .insert({
      session_id: params.id,
      role: 'assistant',
      content: responseText,
      input_tokens: aiResponse.usage.input_tokens,
      output_tokens: aiResponse.usage.output_tokens,
      extracted_code_blocks: { blocks: codeBlocks },
    })
    .select()
    .single();

  await supabase.rpc('increment_session_counters', {
    p_session_id: params.id,
    p_input_tokens: aiResponse.usage.input_tokens,
    p_output_tokens: aiResponse.usage.output_tokens,
  });

  return Response.json({ userMessage: userMsg, aiMessage: aiMsg });
}
```

`increment_session_counters` RPC:

```sql
create or replace function increment_session_counters(
  p_session_id uuid, p_input_tokens int, p_output_tokens int
) returns void as $$
begin
  update sessions
  set total_input_tokens = total_input_tokens + p_input_tokens,
      total_output_tokens = total_output_tokens + p_output_tokens,
      message_count = message_count + 2
  where id = p_session_id;
end;
$$ language plpgsql;
```

`extractCodeBlocks` 유틸:

````ts
// lib/challenge/index.ts
export function extractCodeBlocks(text: string): CodeBlock[] {
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: CodeBlock[] = [];
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      id: `blk-${Date.now()}-${i++}`,
      language: match[1] || 'plaintext',
      content: match[2].trim(),
      line_count: match[2].split('\n').length,
    });
  }
  return blocks;
}

export function buildSystemPrompt(taskDef: TaskDefinition): string {
  return `당신은 개발자가 풀고 있는 다음 태스크를 돕는 AI 어시스턴트입니다.

[태스크]
${taskDef.metadata.title}

[배경]
${taskDef.context.background}

[요구사항]
${taskDef.requirements.map((r) => `- ${r.description}`).join('\n')}

사용자의 질문에 답하고 코드를 작성하세요.`;
}
````

## 6.2 결과물 제출 API (개발자 A → B 인터페이스)

```ts
// app/api/sessions/[id]/submit/route.ts
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const { artifactId } = await req.json();

  const { data: artifact } = await supabase
    .from('artifacts')
    .select('id, session_id, sessions!inner(user_id, status)')
    .eq('id', artifactId)
    .eq('session_id', params.id)
    .single();

  if (!artifact || artifact.sessions.user_id !== user.id) {
    return Response.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }

  if (artifact.sessions.status !== 'in_progress') {
    return Response.json({ error: { code: 'SESSION_INVALID' } }, { status: 400 });
  }

  await supabase.rpc('submit_artifact', {
    p_session_id: params.id,
    p_artifact_id: artifactId,
  });

  // 비동기 채점 트리거 — Supabase Edge Function (개발자 B 담당)
  await fetch(`${process.env.SUPABASE_URL}/functions/v1/evaluate-session`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId: params.id }),
  });

  return Response.json({ status: 'evaluating', estimated_seconds: 30 });
}
```

`submit_artifact` RPC:

```sql
create or replace function submit_artifact(p_session_id uuid, p_artifact_id uuid)
returns void as $$
begin
  update artifacts set is_final = false where session_id = p_session_id;
  update artifacts set is_final = true where id = p_artifact_id;
  update sessions
  set status = 'evaluating', submitted_at = now(), attempt_count = attempt_count + 1
  where id = p_session_id;
end;
$$ language plpgsql;
```

## 6.3 채점 Edge Function 진입점 (개발자 B 담당)

```ts
// supabase/functions/evaluate-session/index.ts
import { runEvaluationPipeline } from './pipeline.ts';

Deno.serve(async (req) => {
  const { sessionId } = await req.json();

  // 비동기 실행 — HTTP 응답은 즉시 반환
  EdgeRuntime.waitUntil(runEvaluationPipeline(sessionId));

  return new Response(JSON.stringify({ status: 'started' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

`runEvaluationPipeline`은 [2.5](./02-evaluation-logic.md#25-통합-파이프라인--runevaluationpipeline)에 정의됨.

## 6.4 에러 응답 표준

```json
{
  "error": {
    "code": "SESSION_EXPIRED",
    "message": "세션이 만료되었습니다.",
    "details": {}
  }
}
```

| 코드                     | HTTP | 의미                      |
| ------------------------ | ---- | ------------------------- |
| `UNAUTHORIZED`           | 401  | 로그인 필요               |
| `FORBIDDEN`              | 403  | 권한 없음                 |
| `INVALID_INPUT`          | 400  | 요청 본문 형식 오류       |
| `SESSION_INVALID`        | 400  | 세션 상태 오류            |
| `MESSAGE_LIMIT_EXCEEDED` | 429  | 세션당 메시지 한도 (50개) |
| `RATE_LIMITED`           | 429  | 분/일 단위 호출 제한      |
| `EVALUATION_FAILED`      | 500  | 채점 실패                 |
| `INTERNAL_ERROR`         | 500  | 그 외                     |
