import type { ChallengeDefinition } from '@/lib/challenge';
import type {
  AggregatedResult,
  JudgeResult,
  QuantitativeResult,
  ValidatorResult,
} from '@/lib/types/evaluation';

export interface EvaluationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface EvaluationUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface EvaluationInput {
  slug: string;
  artifact: string;
  messages: EvaluationMessage[];
  usage: EvaluationUsage;
  elapsed_seconds: number;
  attempt_count: number;
}

export interface EvaluationMetricReason {
  label: string;
  score: number;
  max: number;
  reason: string;
}

export type EvaluationChallengeSummary = Pick<
  ChallengeDefinition,
  'slug' | 'title' | 'category' | 'difficulty'
>;

export interface EvaluationSummary {
  attempt_count: number;
  elapsed_seconds: number;
  total_tokens: number;
  message_count: number;
}

export interface EvaluationResult extends AggregatedResult {
  slug: string;
  challenge: EvaluationChallengeSummary;
  validator_passed: boolean;
  metricReasons: EvaluationMetricReason[];
  summary: EvaluationSummary;
  validator: ValidatorResult;
  quantitative?: QuantitativeResult;
  judge?: JudgeResult;
}
