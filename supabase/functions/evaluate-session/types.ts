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

export interface TaskDefinition {
  metadata: {
    id: string;
    title: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimated_minutes: number;
    version: number;
    author: string;
    created_at: string;
  };
  context: {
    background: string;
    scenario: string;
  };
  requirements: Requirement[];
  artifact_format: {
    type: string;
    language: string;
    stub?: string;
  };
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

export interface ValidatorResult {
  passed: boolean;
  passed_requirements: string[];
  failed_requirements: Array<{ id: string; reason: string }>;
  overall_reason: string;
  test_results?: TestCaseResult[];
}

export interface TestCaseResult {
  id: string;
  type: string;
  passed: boolean;
  input: unknown;
  expected: unknown;
  actual: unknown;
  reason?: string;
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
    test_results?: TestCaseResult[];
  };
}
