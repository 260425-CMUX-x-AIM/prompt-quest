// API 요청/응답 계약. A·B 모두 import.
// 사양: docs/06-api-endpoints.md (12개 엔드포인트), docs/03-team-split.md §3.4.

import type { Artifact, Message, Session, SessionStatus } from '@/lib/types/session';
import type { Difficulty, TaskDefinition } from '@/lib/types/task';
import type { AggregatedResult, EvaluationStage } from '@/lib/types/evaluation';

// ──────────────────────────────────────────────────────────────────────────
// 표준 에러 봉투 — 06-api-endpoints.md §6.4
// ──────────────────────────────────────────────────────────────────────────

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'SESSION_INVALID'
  | 'MESSAGE_LIMIT_EXCEEDED'
  | 'RATE_LIMITED'
  | 'EVALUATION_FAILED'
  | 'INTERNAL_ERROR';

export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ──────────────────────────────────────────────────────────────────────────
// GET /api/tasks
// ──────────────────────────────────────────────────────────────────────────

export interface TaskListItem {
  id: string;
  slug: string;
  title: string;
  category_slug: string;
  difficulty: Difficulty;
  estimated_minutes: number;
  progress?: {
    attempt_count: number;
    completed_count: number;
    best_score: number | null;
    last_status: SessionStatus | null;
  };
}

export interface ListTasksResponse {
  tasks: TaskListItem[];
}

// ──────────────────────────────────────────────────────────────────────────
// GET /api/leaderboard
// ──────────────────────────────────────────────────────────────────────────

export interface PublicAttemptItem {
  session_id: string;
  user: {
    username: string;
    display_name: string | null;
  };
  task: {
    id: string;
    slug: string;
    title: string;
    category: string;
    difficulty: Difficulty;
  };
  score: number;
  percentile: number | null;
  prompts: string[];
  started_at: string;
  evaluated_at: string | null;
  attempt_count: number;
  message_count: number;
  total_tokens: number;
}

export interface PublicAttemptsResponse {
  attempts: PublicAttemptItem[];
  total: number;
  page: number;
  limit: number;
}

// ──────────────────────────────────────────────────────────────────────────
// GET /api/tasks/[slug]
// ──────────────────────────────────────────────────────────────────────────

export interface GetTaskResponse {
  task: TaskListItem & {
    metadata: TaskDefinition['metadata'];
    context: TaskDefinition['context'];
    requirements: TaskDefinition['requirements'];
    artifact_format: TaskDefinition['artifact_format'];
    constraints: TaskDefinition['constraints'];
  };
}

// ──────────────────────────────────────────────────────────────────────────
// POST /api/sessions
// ──────────────────────────────────────────────────────────────────────────

export interface CreateSessionRequest {
  task_slug: string;
}

export interface CreateSessionResponse {
  session_id: string;
}

// ──────────────────────────────────────────────────────────────────────────
// GET /api/sessions/[id]
// ──────────────────────────────────────────────────────────────────────────

export interface GetSessionResponse {
  session: Session;
  messages: Message[];
  artifacts: Artifact[];
  task: Pick<
    TaskDefinition,
    'metadata' | 'context' | 'requirements' | 'artifact_format' | 'constraints'
  >;
}

// ──────────────────────────────────────────────────────────────────────────
// POST /api/sessions/[id]/messages
// ──────────────────────────────────────────────────────────────────────────

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  userMessage: Message;
  aiMessage: Message;
}

// ──────────────────────────────────────────────────────────────────────────
// POST /api/sessions/[id]/artifacts
// ──────────────────────────────────────────────────────────────────────────

// MVP UI는 AI 추출 결과만 신규 INSERT. 'manual' 신규 작성은 v1.5.
export interface CreateArtifactRequest {
  content: string;
  language?: string;
  source: 'ai_extracted';
}

export interface CreateArtifactResponse {
  artifact: Artifact;
}

// ──────────────────────────────────────────────────────────────────────────
// PATCH /api/sessions/[id]/artifacts/[artifactId]
// ──────────────────────────────────────────────────────────────────────────

// DB의 ArtifactSource는 3-value지만, 사용자 PATCH 입력은 2-value로 좁힘.
export interface UpdateArtifactRequest {
  content: string;
  source: 'user_edited' | 'ai_extracted';
}

export interface UpdateArtifactResponse {
  artifact: Artifact;
}

// ──────────────────────────────────────────────────────────────────────────
// POST /api/sessions/[id]/submit
// ──────────────────────────────────────────────────────────────────────────

export interface SubmitRequest {
  artifact_id: string;
}

export interface SubmitResponse {
  status: 'evaluating';
  estimated_seconds: number;
}

// ──────────────────────────────────────────────────────────────────────────
// GET /api/sessions/[id]/evaluation
// ──────────────────────────────────────────────────────────────────────────

export interface EvaluationResponse {
  status: 'evaluating' | 'evaluated' | 'failed';
  evaluation: AggregatedResult | null;
  stages: EvaluationStage[];
}

// ──────────────────────────────────────────────────────────────────────────
// POST /api/sessions/[id]/abandon
// ──────────────────────────────────────────────────────────────────────────

export interface AbandonResponse {
  status: 'abandoned';
}

// ──────────────────────────────────────────────────────────────────────────
// POST /api/evaluations/[id]/disputes  (B 라우트지만 A 모달이 호출)
// 사양: docs/05-database-schema.md:292 (reason CHECK 제약)
// ──────────────────────────────────────────────────────────────────────────

export type DisputeReason = 'score_too_low' | 'score_too_high' | 'bad_feedback' | 'other';

export interface CreateDisputeRequest {
  reason: DisputeReason;
  user_comment?: string;
}

export interface CreateDisputeResponse {
  dispute_id: string;
  status: 'pending';
}

// ──────────────────────────────────────────────────────────────────────────
// GET /api/me/sessions
// ──────────────────────────────────────────────────────────────────────────

export interface MeSessionsQuery {
  status?: SessionStatus;
  page?: number;
  limit?: number;
}

export interface MeSessionsItem extends Session {
  task: Pick<TaskDefinition['metadata'], 'id' | 'title' | 'category' | 'difficulty'>;
  total_score: number | null;
}

export interface MeSessionsResponse {
  sessions: MeSessionsItem[];
  total: number;
  page: number;
  limit: number;
}

export interface PublicProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface UserSessionsResponse {
  profile: PublicProfile;
  sessions: MeSessionsItem[];
  total: number;
  page: number;
  limit: number;
}
