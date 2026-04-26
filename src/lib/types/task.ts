// 태스크 정의 (YAML로부터 파싱) 도메인 타입.
// 사양: docs/03-team-split.md §3.4, docs/08-task-system.md.

export type Difficulty = 'easy' | 'medium' | 'hard';

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
