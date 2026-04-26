import { getChallengeDefinition } from '@/lib/challenge';
import { aggregateEvaluation } from '@/lib/evaluation/aggregator';
import { analyzeQuantitative } from '@/lib/evaluation/quantitative';
import type { EvaluationInput, EvaluationResult } from '@/lib/evaluation/types';
import type { JudgeResult, ValidatorResult } from '@/lib/types/evaluation';

export interface GoldenSetCase {
  id: string;
  slug: string;
  input: EvaluationInput;
  validator: ValidatorResult;
  judge?: JudgeResult;
  score_distribution?: number[];
  expected_total_score: {
    min: number;
    max: number;
  };
  expected_low_confidence?: boolean;
}

export interface GoldenSetResult {
  id: string;
  passed: boolean;
  result: EvaluationResult;
}

export function runGoldenSetCase(testCase: GoldenSetCase): GoldenSetResult {
  const challenge = getChallengeDefinition(testCase.slug);
  const quantitative = testCase.validator.passed
    ? analyzeQuantitative(testCase.input, challenge.baseline)
    : undefined;

  const result = aggregateEvaluation({
    challenge,
    input: testCase.input,
    validator: testCase.validator,
    quantitative,
    judge: testCase.validator.passed ? testCase.judge : undefined,
    scoreDistribution: testCase.score_distribution ?? [],
  });

  const inRange =
    result.total_score >= testCase.expected_total_score.min &&
    result.total_score <= testCase.expected_total_score.max;
  const confidenceMatches =
    testCase.expected_low_confidence == null ||
    result.meta.is_low_confidence === testCase.expected_low_confidence;

  return {
    id: testCase.id,
    passed: inRange && confidenceMatches,
    result,
  };
}

export function runGoldenSetRegression(testCases: GoldenSetCase[]): GoldenSetResult[] {
  return testCases.map(runGoldenSetCase);
}
