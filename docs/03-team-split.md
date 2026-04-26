# 3. 2인 개발 파트 분담

## 3.1 분담 원칙

2명이 서로 차단(block)되지 않고 병렬로 개발할 수 있도록 다음 원칙으로 나눕니다.

1. **계약(Contract) 우선** — DB 스키마, API 엔드포인트, TypeScript 타입을 Day 1에 합의 후 고정
2. **수직 분리** — 한 명은 사용자 흐름 전체 (대화 + 결과물 빌드), 다른 한 명은 평가 파이프라인 전체
3. **공유 영역 최소화** — 둘 다 수정해야 하는 파일을 줄임. 충돌 시 PR 머지 우선순위는 합의 영역 변경자
4. **데일리 동기화** — 매일 30분 미만 스탠드업으로 막힌 부분 공유

## 3.2 역할 정의

### 개발자 A — "대화 / 사용자 경험" 담당

**책임 영역:**

- 사용자 인증 + 프로필
- 태스크 목록/상세 화면
- 챌린지 화면 (3분할 — 좌측 정보, 중앙 대화, 우측 결과물)
- 메시지 송수신 API + Claude API 연동
- 결과물 작업공간 (artifact 편집, 코드 추출/추가)
- 결과 페이지의 표시 (점수 시각화, 피드백 표시)
- 마이 페이지(`/me`) 히스토리

**기술 초점:**

- Next.js 14 App Router (RSC + Streaming)
- Claude SDK 연동
- 실시간 토큰 카운팅
- Supabase Realtime 구독 (채점 진행 표시)

**일일 코드 비중 (예상):** 프론트엔드 70% / 백엔드 30%

### 개발자 B — "평가 / 데이터 / 인프라" 담당

**책임 영역:**

- DB 스키마 마이그레이션 + RLS 정책
- 태스크 YAML 시스템 (파싱, 검증, 시드)
- **평가 파이프라인 전체 (2장의 4단계 모두)**
  - Validator 모듈
  - Quantitative Analyzer
  - Judge ensemble
  - Aggregator
  - 통합 파이프라인
- Supabase Edge Function 셋업 + 배포
- OpenAI API 연동 (Validator/Judge용)
- 골든 셋 회귀 테스트 스크립트
- Rate Limiting + Sentry/로깅
- 법적 페이지 (`/terms`, `/privacy`) — 정적 MDX
- 운영자 분쟁 처리 도구

**기술 초점:**

- Supabase (PostgreSQL + Edge Functions + RLS)
- Deno 런타임 (Edge Function)
- OpenAI SDK
- 평가 알고리즘 + 통계 (stddev, entropy 등)

**일일 코드 비중 (예상):** 백엔드 80% / 데이터/스크립트 20%

## 3.3 공유 책임 영역

다음 항목은 **둘 다 알아야 하고, 누구나 수정할 수 있는 합의 영역**입니다.

| 영역                 | 위치                            | 합의 시점 |
| -------------------- | ------------------------------- | --------- |
| TypeScript 타입 정의 | `lib/types/*.ts`                | Day 1     |
| API 엔드포인트 계약  | 6장 + `lib/api/contracts.ts`    | Day 1     |
| DB 스키마            | 5장 + `supabase/migrations/`    | Day 1     |
| 환경 변수            | `.env.example` (부록 A)         | Day 1     |
| 디자인 토큰          | (외부 데모 프로젝트에서 가져옴) | Day 1     |

**규칙:**

- 합의 영역을 수정해야 한다면 **PR 전에 Slack으로 동기 알림**
- 머지 후 상대방이 5분 안에 자기 브랜치를 rebase
- 타입 변경은 **두 사람 모두 파일을 보고 있을 때만** 진행 (직접 만나거나 페어 프로그래밍)

## 3.4 인터페이스 계약 (Day 1 합의 사항)

개발 시작 전에 다음 6개 인터페이스를 합의해서 파일로 만들어 두면 두 사람이 mock으로 병렬 개발 가능.

### `lib/types/session.ts`

```ts
export type SessionStatus =
  | 'in_progress'
  | 'submitted'
  | 'evaluating'
  | 'evaluated'
  | 'failed'
  | 'abandoned';

export interface Session {
  id: string;
  user_id: string;
  task_id: string;
  status: SessionStatus;
  started_at: string;
  submitted_at: string | null;
  evaluated_at: string | null;
  attempt_count: number;
  message_count: number;
  total_input_tokens: number;
  total_output_tokens: number;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  input_tokens: number | null;
  output_tokens: number | null;
  extracted_code_blocks: { blocks: CodeBlock[] } | null;
  created_at: string;
}

export interface CodeBlock {
  id: string;
  language: string;
  content: string;
  line_count: number;
}

export interface Artifact {
  id: string;
  session_id: string;
  version: number;
  content: string;
  language: string | null;
  source: 'ai_extracted' | 'user_edited' | 'manual';
  is_final: boolean;
  created_at: string;
}
```

### `lib/types/task.ts`

```ts
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface TaskDefinition {
  metadata: {
    id: string;
    title: string;
    category: string;
    difficulty: Difficulty;
    estimated_minutes: number;
    version: number;
    author: string;
    created_at: string;
  };
  context: {
    background: string;
    scenario: string;
    [key: string]: unknown;
  };
  requirements: Requirement[];
  artifact_format: { type: string; language: string; stub?: string };
  test_cases: TestCase[];
  constraints: {
    max_attempts: number;
    time_limit_seconds: number;
    forbidden_patterns?: string[];
  };
  baseline?: {
    median_total_tokens?: number;
    median_attempts?: number;
    median_time_seconds?: number;
    computed_from_sessions?: number;
  };
}

export interface Requirement {
  id: string;
  description: string;
  weight?: number;
}

export interface TestCase {
  id: string;
  input: unknown;
  expected_output?: unknown;
  expected_matches?: unknown[];
  type: 'positive' | 'negative' | 'edge_case' | 'error_handling';
  description?: string;
}
```

### `lib/types/evaluation.ts`

```ts
export interface ValidatorResult {
  passed: boolean;
  passed_requirements: string[];
  failed_requirements: { id: string; reason: string }[];
  overall_reason: string;
}

export interface QuantitativeResult {
  efficiency: {
    token_score: number;
    attempt_score: number;
    time_score: number;
    total: number;
    baseline_source: 'observed' | 'estimated' | 'default';
  };
  patterns: {
    redundancy_ratio: number;
    context_reference_count: number;
    avg_user_message_length: number;
    error_recovery_attempts: number;
  };
  pattern_adjustment: number;
}

export interface JudgeRunResult {
  clarity: { score: number; reason: string };
  context: { score: number; reason: string };
  recovery: { score: number; reason: string };
  feedback: { good: string; improve: string };
}

export interface JudgeResult extends JudgeRunResult {
  raw_runs: JudgeRunResult[];
  inter_run_stddev: { clarity: number; context: number; recovery: number };
  successful_runs: number;
}

export interface AggregatedResult {
  total_score: number;
  scores: {
    correctness: number;
    efficiency: number;
    context: number;
    recovery: number;
    clarity: number;
    pattern_bonus: number;
  };
  feedback: { good: string; improve: string };
  percentile: number;
  meta: {
    baseline_source: 'observed' | 'estimated' | 'default';
    judge_runs_succeeded: number;
    judge_max_stddev: number;
    is_low_confidence: boolean;
  };
}
```

### `lib/api/contracts.ts`

API 엔드포인트의 요청/응답 타입을 명시. 양쪽이 mock으로 개발 가능.

```ts
// POST /api/sessions
export interface CreateSessionRequest {
  task_slug: string;
}
export interface CreateSessionResponse {
  session_id: string;
}

// POST /api/sessions/:id/messages
export interface SendMessageRequest {
  content: string;
}
export interface SendMessageResponse {
  userMessage: Message;
  aiMessage: Message;
}

// PATCH /api/sessions/:id/artifacts/:artifactId
export interface UpdateArtifactRequest {
  content: string;
  source: 'user_edited' | 'ai_extracted';
}

// POST /api/sessions/:id/submit
export interface SubmitRequest {
  artifact_id: string;
}
export interface SubmitResponse {
  status: 'evaluating';
  estimated_seconds: number;
}

// GET /api/sessions/:id/evaluation
export interface EvaluationResponse {
  status: 'evaluating' | 'evaluated' | 'failed';
  evaluation: AggregatedResult | null;
  stages: EvaluationStage[];
}

export interface EvaluationStage {
  stage: 'validator' | 'quantitative' | 'judge' | 'aggregator';
  status: 'pending' | 'running' | 'success' | 'failed';
  duration_ms: number | null;
  error_message: string | null;
}
```

## 3.5 병렬 개발 가능 검증

이 분담의 핵심은 **둘이 서로를 기다리지 않고 동시에 진행 가능**한가입니다.

| 시점  | 개발자 A 작업                    | 개발자 B 작업                   | 차단 여부                     |
| ----- | -------------------------------- | ------------------------------- | ----------------------------- |
| Day 1 | 인터페이스 합의 + 셋업           | 인터페이스 합의 + 셋업          | (페어)                        |
| Day 2 | 인증 + 태스크 목록 (mock 데이터) | DB 마이그레이션 + 태스크 시드   | ✅ 병렬                       |
| Day 3 | 챌린지 레이아웃 + 메시지 mock    | Validator + Quantitative        | ✅ 병렬                       |
| Day 4 | Claude API 연동 (실제 호출)      | Judge + Aggregator              | ✅ 병렬                       |
| Day 5 | 결과물 작업공간 + 토큰 카운터    | 통합 파이프라인 + Edge Function | ✅ 병렬                       |
| Day 6 | 제출 모달 + 결과 화면            | 평가 결과 저장 + Realtime 발행  | ⚠️ 결과 화면 ↔︎ 평가 결과 형식 |
| Day 7 | 마이 페이지 + 에러 처리          | Rate Limiting + 분쟁 도구       | ✅ 병렬                       |
| Day 8 | 베타 빌드 + 버그 수정            | 골든 셋 셋업 + 문서             | ✅ 병렬                       |

⚠️ Day 6의 "결과 화면 ↔︎ 평가 결과 형식"이 유일한 동기화 지점. 3.4의 `AggregatedResult` 타입을 Day 1에 확정하면 이것도 차단되지 않음.

## 3.6 PR 워크플로우

```
main
 ├── feat/auth-flow                  (A)
 ├── feat/task-list                  (A)
 ├── feat/challenge-screen           (A)
 ├── feat/db-schema                  (B)
 ├── feat/evaluator-validator        (B)
 ├── feat/evaluator-judge            (B)
 └── feat/evaluation-pipeline        (B)
```

**PR 규칙:**

- 매일 1개 이상 PR 머지 (작은 단위)
- 합의 영역 (`lib/types/`, `lib/api/contracts.ts`, `supabase/migrations/`) 변경 시 **상대방 1명 리뷰 필수**
- 그 외 영역은 self-merge 허용 (속도 우선)

## 3.7 코드 충돌 회피 전략

**파일 단위 분리:**

| 디렉토리                | 주 담당           | 부 담당                   |
| ----------------------- | ----------------- | ------------------------- |
| `app/(auth)/`           | A                 | -                         |
| `app/(main)/tasks/`     | A                 | -                         |
| `app/(main)/challenge/` | A                 | -                         |
| `app/(main)/results/`   | A                 | B (점수 데이터 형식 합의) |
| `app/(main)/me/`        | A                 | -                         |
| `app/api/sessions/`     | A                 | -                         |
| `app/api/me/`           | A                 | -                         |
| `lib/anthropic/`        | A                 | -                         |
| `lib/openai/`           | -                 | B                         |
| `lib/evaluation/`       | -                 | B                         |
| `supabase/migrations/`  | -                 | B                         |
| `supabase/functions/`   | -                 | B                         |
| `scripts/`              | -                 | B                         |
| `lib/types/`            | 공유 (Day 1 합의) | 공유                      |
| `lib/api/contracts.ts`  | 공유              | 공유                      |
| `app/(legal)/`          | -                 | B                         |
| `components/` (공통 UI) | A                 | -                         |

**충돌이 자주 일어날 수 있는 곳:**

- `lib/types/` — Day 1 합의 후 변경 시 페어 프로그래밍
- `app/api/sessions/[id]/submit/route.ts` — A가 호출, B가 채점 트리거 → 인터페이스 미리 합의
- `package.json` — 둘 다 의존성 추가 가능, conflict 시 알파벳순 정렬 후 머지

## 3.8 데일리 스탠드업 템플릿

매일 같은 시간 (예: 오전 10시) 15~30분.

```
[어제 무엇을 했나]
- 종료된 PR / 진행 중 작업

[오늘 무엇을 할 건가]
- 오늘 머지 목표 PR

[막힌 게 있나]
- 인터페이스 변경 필요?
- 상대방 코드 어디가 필요?
```

페어 프로그래밍이 필요한 시점:

- Day 1: 인터페이스 합의
- Day 6: 결과 화면 ↔︎ 평가 결과 형식 통합
- 베타 후 디버깅: 평가 결과가 이상할 때 함께 `evaluation_stages` 분석

## 3.9 베타 이후 운영 분담

MVP 출시 후:

| 영역                 | 담당                                |
| -------------------- | ----------------------------------- |
| 사용자 피드백 응대   | A (사용자 경험 이해도)              |
| 채점 분쟁 검토       | B (`evaluation_stages` 분석 가능)   |
| 신규 태스크 작성     | 공유 (운영자 1명이 단독으로도 가능) |
| 골든 셋 채점         | 공유 + 외부 1명 (검수)              |
| 비용/사용량 모니터링 | B                                   |
| 성능 이슈            | A (프론트엔드) / B (백엔드)         |
