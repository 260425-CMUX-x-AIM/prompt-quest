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

export interface CodeBlock {
  id: string;
  language: string;
  content: string;
  line_count: number;
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
