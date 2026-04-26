import type {
  AggregatedResult,
  JudgeResult,
  QuantitativeResult,
  ValidatorResult,
} from './types.ts';

interface AggregateInput {
  validator: ValidatorResult;
  quantitative: QuantitativeResult;
  judge: JudgeResult;
  task: { difficulty: 'easy' | 'medium' | 'hard' };
  scoreDistribution: number[];
}

const DIFFICULTY_MULTIPLIER = {
  easy: 1,
  medium: 1.05,
  hard: 1.15,
} as const;

export function aggregate({
  validator,
  quantitative,
  judge,
  task,
  scoreDistribution,
}: AggregateInput): AggregatedResult {
  const correctness = validator.passed ? 40 : 0;
  const efficiency = round(quantitative.efficiency.total);
  const context = round(judge.context.score * 1.5);
  const recovery = round(judge.recovery.score);
  const clarity = round(judge.clarity.score * 0.5);
  const patternBonus = round(quantitative.pattern_adjustment);
  const subtotal = correctness + efficiency + context + recovery + clarity + patternBonus;
  const difficultyMultiplier = DIFFICULTY_MULTIPLIER[task.difficulty] ?? 1;
  const totalScore = clamp(Math.round(subtotal * difficultyMultiplier), 0, 100);
  const judgeMaxStddev = round(
    Math.max(
      judge.inter_run_stddev.clarity,
      judge.inter_run_stddev.context,
      judge.inter_run_stddev.recovery,
    ),
  );
  const percentile = round(computePercentile(totalScore, scoreDistribution));
  const isLowConfidence =
    judge.successful_runs < 2 ||
    judgeMaxStddev > 2 ||
    quantitative.efficiency.baseline_source === 'default';

  return {
    total_score: totalScore,
    scores: {
      correctness,
      efficiency,
      context,
      recovery,
      clarity,
      pattern_bonus: patternBonus,
    },
    feedback: judge.feedback,
    percentile,
    meta: {
      baseline_source: quantitative.efficiency.baseline_source,
      judge_runs_succeeded: judge.successful_runs,
      judge_max_stddev: judgeMaxStddev,
      is_low_confidence: isLowConfidence,
    },
  };
}

function computePercentile(score: number, distribution: number[]): number {
  if (distribution.length === 0) return 50;
  return (distribution.filter((value) => value < score).length / distribution.length) * 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
