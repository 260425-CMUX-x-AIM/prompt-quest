import type { ChallengeDefinition } from '@/lib/challenge';
import type {
  EvaluationInput,
  EvaluationMetricReason,
  EvaluationResult,
  JudgeResult,
  QuantitativeResult,
  ValidatorResult,
} from '@/lib/evaluation/types';
import type { EvaluationProviderConfig } from '@/lib/evaluation/providers';

interface AggregateInput {
  config: EvaluationProviderConfig;
  challenge: ChallengeDefinition;
  input: EvaluationInput;
  validator: ValidatorResult;
  quantitative?: QuantitativeResult;
  judge?: JudgeResult;
}

export function aggregateEvaluation({
  config,
  challenge,
  input,
  validator,
  quantitative,
  judge,
}: AggregateInput): EvaluationResult {
  const totalTokens = input.usage.inputTokens + input.usage.outputTokens;

  if (!quantitative || !judge) {
    return {
      slug: input.slug,
      challenge: {
        slug: challenge.slug,
        title: challenge.title,
        category: challenge.category,
        difficulty: challenge.difficulty,
      },
      totalScore: 0,
      validatorPassed: validator.passed,
      breakdown: {
        correctness: 0,
        efficiency: 0,
        context: 0,
        recovery: 0,
        clarity: 0,
      },
      metricReasons: [
        {
          label: '정확성',
          score: 0,
          max: 40,
          reason: validator.passed
            ? validator.overallReason
            : `Validator FAIL · ${validator.overallReason}`,
        },
        ...buildUnavailableReasons(),
      ],
      feedback: {
        good: '요구사항을 다시 정리한 뒤 재도전해 보세요.',
        improve:
          validator.failedRequirements.map((item) => `${item.id}: ${item.reason}`).join(' / ') ||
          validator.overallReason,
      },
      summary: {
        attemptCount: input.attemptCount,
        elapsedSeconds: input.elapsedSeconds,
        totalTokens,
        messageCount: input.messages.length,
      },
      meta: {
        evaluator: config.provider,
        validatorModel: config.validatorModel,
        judgeModel: config.judgeModel,
      },
      validator,
    };
  }

  const correctness = validator.passed ? 40 : 0;
  const efficiency = round(quantitative.efficiency.total);
  const context = round(judge.context.score * 1.5);
  const recovery = round(judge.recovery.score);
  const clarity = round(judge.clarity.score * 0.5);
  const totalScore = clamp(
    Math.round(correctness + efficiency + context + recovery + clarity),
    0,
    100,
  );

  return {
    slug: input.slug,
    challenge: {
      slug: challenge.slug,
      title: challenge.title,
      category: challenge.category,
      difficulty: challenge.difficulty,
    },
    totalScore,
    validatorPassed: validator.passed,
    breakdown: {
      correctness,
      efficiency,
      context,
      recovery,
      clarity,
    },
    metricReasons: buildSuccessReasons(validator, quantitative, judge),
    feedback: validator.passed
      ? judge.feedback
      : {
          good: judge.feedback.good,
          improve:
            [
              validator.failedRequirements.map((item) => `${item.id}: ${item.reason}`).join(' / '),
              judge.feedback.improve,
            ]
              .filter(Boolean)
              .join(' '),
        },
    summary: {
      attemptCount: input.attemptCount,
      elapsedSeconds: input.elapsedSeconds,
      totalTokens,
      messageCount: input.messages.length,
    },
    meta: {
      evaluator: config.provider,
      validatorModel: config.validatorModel,
      judgeModel: config.judgeModel,
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
  ];
}

function buildSuccessReasons(
  validator: ValidatorResult,
  quantitative: QuantitativeResult,
  judge: JudgeResult,
): EvaluationMetricReason[] {
  return [
    {
      label: '정확성',
      score: validator.passed ? 40 : 0,
      max: 40,
      reason: `${validator.passed ? 'Validator PASS' : 'Validator FAIL'} · ${validator.overallReason}`,
    },
    {
      label: '효율성',
      score: quantitative.efficiency.total,
      max: 30,
      reason: `${quantitative.reasons.token} · ${quantitative.reasons.attempt} · ${quantitative.reasons.time}`,
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
  ];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
