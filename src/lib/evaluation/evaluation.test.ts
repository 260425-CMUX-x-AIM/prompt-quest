import { describe, expect, it } from 'vitest';
import { HARD_CODED_CHALLENGE } from '@/lib/challenge';
import { aggregateEvaluation } from '@/lib/evaluation/aggregator';
import { analyzeQuantitative } from '@/lib/evaluation/quantitative';
import type { EvaluationInput } from '@/lib/evaluation/types';

const baseInput: EvaluationInput = {
  slug: HARD_CODED_CHALLENGE.slug,
  artifact:
    'const EMAIL_REGEX = /\\b[A-Za-z0-9._%+\\-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\\.[A-Za-z]+\\b/g;',
  messages: [
    {
      role: 'user',
      content: '이메일 정규식을 만들어줘. 도메인에 점이 필요하고 ReDoS는 피해야 해.',
    },
    {
      role: 'assistant',
      content: '초안을 만들었어요.',
    },
    {
      role: 'user',
      content: '위 패턴에서 a@b.c 도 통과하도록 수정해줘.',
    },
  ],
  usage: {
    inputTokens: 320,
    outputTokens: 180,
  },
  elapsedSeconds: 150,
  attemptCount: 1,
};

describe('analyzeQuantitative', () => {
  it('기준보다 효율적이면 높은 효율 점수를 반환한다', () => {
    const result = analyzeQuantitative(baseInput, HARD_CODED_CHALLENGE.baseline);

    expect(result.efficiency.tokenScore).toBe(12);
    expect(result.efficiency.attemptScore).toBe(12);
    expect(result.efficiency.timeScore).toBe(6);
    expect(result.efficiency.total).toBeGreaterThanOrEqual(29);
  });

  it('중복 지시와 짧은 입력이 많으면 효율 총점이 내려간다', () => {
    const result = analyzeQuantitative(
      {
        ...baseInput,
        messages: [
          { role: 'user', content: '고쳐줘' },
          { role: 'assistant', content: '무엇을 고칠까요?' },
          { role: 'user', content: '고쳐줘' },
          { role: 'assistant', content: '다시 설명해 주세요.' },
          { role: 'user', content: '고쳐줘' },
        ],
        elapsedSeconds: 400,
        attemptCount: 4,
        usage: {
          inputTokens: 900,
          outputTokens: 700,
        },
      },
      HARD_CODED_CHALLENGE.baseline,
    );

    expect(result.patterns.redundancyRatio).toBeGreaterThan(0.4);
    expect(result.efficiency.total).toBeLessThan(15);
  });
});

describe('aggregateEvaluation', () => {
  const config = {
    provider: 'openai' as const,
    validatorModel: 'gpt-4.1-mini',
    judgeModel: 'gpt-4.1-mini',
    apiKey: 'test',
  };

  it('validator fail이면 총점을 0점으로 반환한다', () => {
    const result = aggregateEvaluation({
      config,
      challenge: HARD_CODED_CHALLENGE,
      input: baseInput,
      validator: {
        passed: false,
        passedRequirements: ['req-1'],
        failedRequirements: [{ id: 'req-2', reason: '도메인 점 조건을 충족하지 못함' }],
        overallReason: '요구사항 일부가 누락되었습니다.',
      },
    });

    expect(result.totalScore).toBe(0);
    expect(result.validatorPassed).toBe(false);
    expect(result.metricReasons[0]?.reason).toContain('요구사항 일부가 누락되었습니다.');
  });

  it('validator pass이면 100점 만점 기준으로 항목 점수를 합산한다', () => {
    const quantitative = analyzeQuantitative(baseInput, HARD_CODED_CHALLENGE.baseline);
    const result = aggregateEvaluation({
      config,
      challenge: HARD_CODED_CHALLENGE,
      input: baseInput,
      validator: {
        passed: true,
        passedRequirements: ['req-1', 'req-2', 'req-3'],
        failedRequirements: [],
        overallReason: '모든 요구사항을 충족했습니다.',
      },
      quantitative,
      judge: {
        clarity: { score: 8, reason: '처음 요청이 구체적이었습니다.' },
        context: { score: 9, reason: '이전 응답을 이어서 개선했습니다.' },
        recovery: { score: 8, reason: '오류를 분명히 짚고 수정했습니다.' },
        feedback: {
          good: '맥락을 잘 이어 갔습니다.',
          improve: 'edge case를 더 빨리 제시해 보세요.',
        },
      },
    });

    expect(result.totalScore).toBeLessThanOrEqual(100);
    expect(result.totalScore).toBeGreaterThan(80);
    expect(result.breakdown.correctness).toBe(40);
    expect(result.breakdown.context).toBe(13.5);
    expect(result.breakdown.clarity).toBe(4);
  });
});
