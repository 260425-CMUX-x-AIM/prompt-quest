import type { ChallengeDefinition } from '@/lib/challenge';
import type {
  EvaluationInput,
  EvaluationMetricReason,
  EvaluationResult,
} from '@/lib/evaluation/types';
import type { JudgeResult, QuantitativeResult, ValidatorResult } from '@/lib/types/evaluation';

interface AggregateInput {
  challenge: ChallengeDefinition;
  input: EvaluationInput;
  validator: ValidatorResult;
  quantitative?: QuantitativeResult;
  judge?: JudgeResult;
  scoreDistribution?: number[];
}

const DIFFICULTY_MULTIPLIER = {
  easy: 1,
  medium: 1.05,
  hard: 1.15,
} as const;

export function aggregateEvaluation({
  challenge,
  input,
  validator,
  quantitative,
  judge,
  scoreDistribution = [],
}: AggregateInput): EvaluationResult {
  const totalTokens = input.usage.input_tokens + input.usage.output_tokens;

  if (!quantitative || !judge) {
    return {
      slug: input.slug,
      challenge: {
        slug: challenge.slug,
        title: challenge.title,
        category: challenge.category,
        difficulty: challenge.difficulty,
      },
      total_score: 0,
      scores: {
        correctness: 0,
        efficiency: 0,
        context: 0,
        recovery: 0,
        clarity: 0,
        pattern_bonus: 0,
      },
      metricReasons: [
        {
          label: '정확성',
          score: 0,
          max: 40,
          reason: validator.passed
            ? validator.overall_reason
            : `Validator FAIL · ${validator.overall_reason}`,
        },
        ...buildUnavailableReasons(),
      ],
      feedback: {
        good: '요구사항을 다시 정리한 뒤 재도전해 보세요.',
        improve:
          validator.failed_requirements.map((item) => `${item.id}: ${item.reason}`).join(' / ') ||
          validator.overall_reason,
      },
      percentile: 0,
      meta: {
        baseline_source: 'estimated',
        judge_runs_succeeded: 0,
        judge_max_stddev: 0,
        is_low_confidence: true,
      },
      validator_passed: validator.passed,
      summary: {
        attempt_count: input.attempt_count,
        elapsed_seconds: input.elapsed_seconds,
        total_tokens: totalTokens,
        message_count: input.messages.length,
      },
      validator,
    };
  }

  const correctness = 40;
  const efficiency = round(quantitative.efficiency.total);
  const context = round(judge.context.score * 1.5);
  const recovery = round(judge.recovery.score);
  const clarity = round(judge.clarity.score * 0.5);
  const patternBonus = round(quantitative.pattern_adjustment);
  const subtotal = correctness + efficiency + context + recovery + clarity + patternBonus;
  const difficultyMultiplier = DIFFICULTY_MULTIPLIER[challenge.difficulty] ?? 1;
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
    slug: input.slug,
    challenge: {
      slug: challenge.slug,
      title: challenge.title,
      category: challenge.category,
      difficulty: challenge.difficulty,
    },
    total_score: totalScore,
    scores: {
      correctness,
      efficiency,
      context,
      recovery,
      clarity,
      pattern_bonus: patternBonus,
    },
    metricReasons: buildSuccessReasons(
      challenge,
      input,
      validator,
      quantitative,
      judge,
      patternBonus,
    ),
    feedback: judge.feedback,
    percentile,
    meta: {
      baseline_source: quantitative.efficiency.baseline_source,
      judge_runs_succeeded: judge.successful_runs,
      judge_max_stddev: judgeMaxStddev,
      is_low_confidence: isLowConfidence,
    },
    validator_passed: validator.passed,
    summary: {
      attempt_count: input.attempt_count,
      elapsed_seconds: input.elapsed_seconds,
      total_tokens: totalTokens,
      message_count: input.messages.length,
    },
    validator,
    quantitative,
    judge,
  };
}

function buildUnavailableReasons(): EvaluationMetricReason[] {
  return [
    {
      label: '효율성',
      score: 0,
      max: 30,
      reason: '정확성 검증을 통과하지 못해 효율성 계산을 생략했습니다.',
    },
    {
      label: '컨텍스트 활용',
      score: 0,
      max: 15,
      reason: '정확성 검증을 통과하지 못해 Judge 평가를 생략했습니다.',
    },
    {
      label: '에러 복구',
      score: 0,
      max: 10,
      reason: '정확성 검증을 통과하지 못해 Judge 평가를 생략했습니다.',
    },
    {
      label: '프롬프트 명확성',
      score: 0,
      max: 5,
      reason: '정확성 검증을 통과하지 못해 Judge 평가를 생략했습니다.',
    },
    {
      label: '패턴 조정',
      score: 0,
      max: 5,
      reason: '정확성 검증을 통과하지 못해 패턴 보너스/페널티 계산을 생략했습니다.',
    },
  ];
}

function buildSuccessReasons(
  challenge: ChallengeDefinition,
  input: EvaluationInput,
  validator: ValidatorResult,
  quantitative: QuantitativeResult,
  judge: JudgeResult,
  patternBonus: number,
): EvaluationMetricReason[] {
  const totalTokens = input.usage.input_tokens + input.usage.output_tokens;

  return [
    {
      label: '정확성',
      score: validator.passed ? 40 : 0,
      max: 40,
      reason: `${validator.passed ? 'Validator PASS' : 'Validator FAIL'} · ${validator.overall_reason}`,
    },
    {
      label: '효율성',
      score: quantitative.efficiency.total,
      max: 30,
      reason: [
        `총 ${totalTokens.toLocaleString()}토큰 사용 · 기준 ${challenge.baseline.totalTokens.toLocaleString()}토큰`,
        `${input.attempt_count}회 시도 · 기준 ${challenge.baseline.attempts}회`,
        `${formatElapsed(input.elapsed_seconds)} 소요 · 기준 ${formatElapsed(challenge.baseline.timeSeconds)}`,
      ].join(' · '),
    },
    {
      label: '컨텍스트 활용',
      score: round(judge.context.score * 1.5),
      max: 15,
      reason: judge.context.reason,
    },
    {
      label: '에러 복구',
      score: round(judge.recovery.score),
      max: 10,
      reason: judge.recovery.reason,
    },
    {
      label: '프롬프트 명확성',
      score: round(judge.clarity.score * 0.5),
      max: 5,
      reason: judge.clarity.reason,
    },
    {
      label: '패턴 조정',
      score: patternBonus,
      max: 5,
      reason: buildPatternReason(quantitative),
    },
  ];
}

function buildPatternReason(quantitative: QuantitativeResult): string {
  const parts = [
    `중복 비율 ${quantitative.patterns.redundancy_ratio}`,
    `맥락 참조 ${quantitative.patterns.context_reference_count}회`,
    `평균 메시지 길이 ${quantitative.patterns.avg_user_message_length}`,
    `오류 복구 시도 ${quantitative.patterns.error_recovery_attempts}회`,
  ];

  const direction =
    quantitative.pattern_adjustment > 0
      ? `보너스 +${quantitative.pattern_adjustment}`
      : quantitative.pattern_adjustment < 0
        ? `페널티 ${quantitative.pattern_adjustment}`
        : '보정 없음';

  return `${direction} · ${parts.join(' · ')}`;
}

function computePercentile(score: number, distribution: number[]): number {
  if (distribution.length === 0) return 50;
  return (distribution.filter((value) => value < score).length / distribution.length) * 100;
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${String(remainder).padStart(2, '0')}s`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
