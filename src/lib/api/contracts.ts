import type { AggregatedResult } from '@/lib/types/evaluation';
import type { Message } from '@/lib/types/session';

export interface CreateSessionRequest {
  task_slug: string;
}

export interface CreateSessionResponse {
  session_id: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  userMessage: Message;
  aiMessage: Message;
}

export interface UpdateArtifactRequest {
  content: string;
  source: 'user_edited' | 'ai_extracted';
}

export interface SubmitRequest {
  artifact_id: string;
}

export interface SubmitResponse {
  status: 'evaluating';
  estimated_seconds: number;
}

export interface EvaluationStage {
  stage: 'validator' | 'quantitative' | 'judge' | 'aggregator';
  status: 'pending' | 'running' | 'success' | 'failed';
  duration_ms: number | null;
  error_message: string | null;
}

export interface EvaluationResponse {
  status: 'evaluating' | 'evaluated' | 'failed';
  evaluation: AggregatedResult | null;
  stages: EvaluationStage[];
}
