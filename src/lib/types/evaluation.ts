export interface ValidatorResult {
  passed: boolean;
  passed_requirements: string[];
  failed_requirements: Array<{
    id: string;
    reason: string;
  }>;
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
  inter_run_stddev: {
    clarity: number;
    context: number;
    recovery: number;
  };
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
  feedback: {
    good: string;
    improve: string;
  };
  percentile: number;
  meta: {
    baseline_source: 'observed' | 'estimated' | 'default';
    judge_runs_succeeded: number;
    judge_max_stddev: number;
    is_low_confidence: boolean;
  };
}
