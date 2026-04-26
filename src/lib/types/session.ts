// 세션 / 메시지 / 결과물 도메인 타입.
// 사양: docs/03-team-split.md §3.4, docs/05-database-schema.md (sessions, messages, artifacts).

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

// DB는 3-value를 유지 (`'manual'`은 v1.5의 빈 artifact 직접 작성 진입점 보존).
// MVP UI는 `'ai_extracted' | 'user_edited'`만 사용하지만, 도메인 타입은 3-value 그대로.
export type ArtifactSource = 'ai_extracted' | 'user_edited' | 'manual';

export interface Artifact {
  id: string;
  session_id: string;
  version: number;
  content: string;
  language: string | null;
  source: ArtifactSource;
  is_final: boolean;
  created_at: string;
}
