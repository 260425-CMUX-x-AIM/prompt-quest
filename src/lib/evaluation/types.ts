import type { ChallengeBaseline, ChallengeDefinition } from '@/lib/challenge';

export interface EvaluationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface EvaluationUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface EvaluationInput {
  slug: string;
  artifact: string;
  messages: EvaluationMessage[];
  usage: EvaluationUsage;
  elapsedSeconds: number;
  attemptCount: number;
}

export interface EvaluationBreakdown {
  correctness: number;
  efficiency: number;
  context: number;
  recovery: number;
  clarity: number;
}

export interface EvaluationFeedback {
  good: string;
  improve: string;
}

export interface EvaluationMetricReason {
  label: string;
  score: number;
  max: number;
  reason: string;
}

export interface ValidatorFailure {
  id: string;
  reason: string;
}

export interface ValidatorResult {
  passed: boolean;
  passedRequirements: string[];
  failedRequirements: ValidatorFailure[];
  overallReason: string;
}

export interface QuantitativeResult {
  efficiency: {
    tokenScore: number;
    attemptScore: number;
    timeScore: number;
    total: number;
    baseline: ChallengeBaseline;
  };
  patterns: {
    redundancyRatio: number;
    contextReferenceCount: number;
    avgUserMessageLength: number;
    errorRecoveryAttempts: number;
  };
  reasons: {
    token: string;
    attempt: string;
    time: string;
  };
}

export interface JudgeDimension {
  score: number;
  reason: string;
}

export interface JudgeResult {
  clarity: JudgeDimension;
  context: JudgeDimension;
  recovery: JudgeDimension;
  feedback: EvaluationFeedback;
}

export interface EvaluationResult {
  slug: string;
  challenge: Pick<ChallengeDefinition, 'slug' | 'title' | 'category' | 'difficulty'>;
  totalScore: number;
  validatorPassed: boolean;
  breakdown: EvaluationBreakdown;
  metricReasons: EvaluationMetricReason[];
  feedback: EvaluationFeedback;
  summary: {
    attemptCount: number;
    elapsedSeconds: number;
    totalTokens: number;
    messageCount: number;
  };
  meta: {
    evaluator: 'openai' | 'gemini';
    validatorModel: string;
    judgeModel: string;
  };
  validator: ValidatorResult;
  quantitative?: QuantitativeResult;
  judge?: JudgeResult;
}
