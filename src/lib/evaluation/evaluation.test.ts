import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HARD_CODED_CHALLENGE } from '@/lib/challenge';
import { aggregateEvaluation } from '@/lib/evaluation/aggregator';
import { judgeConversation } from '@/lib/evaluation/judge';
import { analyzeQuantitative } from '@/lib/evaluation/quantitative';
import type { EvaluationInput } from '@/lib/evaluation/types';

const { createJsonCompletionMock } = vi.hoisted(() => ({
  createJsonCompletionMock: vi.fn(),
}));

vi.mock('@/lib/evaluation/providers', async () => {
  const actual = await vi.importActual<object>('@/lib/evaluation/providers');

  return {
    ...actual,
    createJsonCompletion: createJsonCompletionMock,
  };
});

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
    input_tokens: 320,
    output_tokens: 180,
  },
  elapsed_seconds: 150,
  attempt_count: 1,
};

beforeEach(() => {
  createJsonCompletionMock.mockReset();
});

describe('analyzeQuantitative', () => {
  it('기준보다 효율적이면 높은 효율 점수를 반환한다', () => {
    const result = analyzeQuantitative(baseInput, HARD_CODED_CHALLENGE.baseline);

    expect(result.efficiency.token_score).toBe(12);
    expect(result.efficiency.attempt_score).toBe(12);
    expect(result.efficiency.time_score).toBe(6);
    expect(result.efficiency.total).toBeGreaterThanOrEqual(29);
    expect(result.efficiency.baseline_source).toBe('estimated');
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
        elapsed_seconds: 400,
        attempt_count: 4,
        usage: {
          input_tokens: 900,
          output_tokens: 700,
        },
      },
      HARD_CODED_CHALLENGE.baseline,
    );

    expect(result.patterns.redundancy_ratio).toBeGreaterThan(0.4);
    expect(result.efficiency.total).toBeLessThan(16);
    expect(result.pattern_adjustment).toBeLessThan(0);
  });
});

describe('judgeConversation', () => {
  const config = {
    provider: 'openai' as const,
    validatorModel: 'gpt-4.1-mini',
    judgeModel: 'gpt-4.1-mini',
    apiKey: 'test',
  };

  it('judge를 3회 실행해 평균과 표준편차를 계산한다', async () => {
    createJsonCompletionMock
      .mockResolvedValueOnce({
        clarity: { score: 8, reason: '첫 요청이 구체적입니다.' },
        context: { score: 9, reason: '이전 응답을 잘 이어 갑니다.' },
        recovery: { score: 7, reason: '수정 방향이 명확합니다.' },
        feedback: { good: '좋았습니다.', improve: '조금 더 빨리 반례를 주세요.' },
      })
      .mockResolvedValueOnce({
        clarity: { score: 7, reason: '핵심은 명확합니다.' },
        context: { score: 8, reason: '대체로 맥락을 유지합니다.' },
        recovery: { score: 8, reason: '복구 지시가 좋습니다.' },
        feedback: { good: '좋았습니다.', improve: '반례를 더 빨리 주세요.' },
      })
      .mockResolvedValueOnce({
        clarity: { score: 9, reason: '처음 요청이 매우 구체적입니다.' },
        context: { score: 8, reason: '컨텍스트 활용이 좋습니다.' },
        recovery: { score: 7, reason: '복구 시도가 안정적입니다.' },
        feedback: { good: '좋았습니다.', improve: '출력 형식을 더 빨리 고정해 보세요.' },
      });

    const result = await judgeConversation(
      config,
      HARD_CODED_CHALLENGE,
      baseInput.messages,
      baseInput.artifact,
    );

    expect(createJsonCompletionMock).toHaveBeenCalledTimes(3);
    expect(result.successful_runs).toBe(3);
    expect(result.clarity.score).toBe(8);
    expect(result.context.score).toBeGreaterThanOrEqual(8);
    expect(result.inter_run_stddev.clarity).toBeGreaterThan(0);
    expect(result.raw_runs).toHaveLength(3);
  });
});

describe('aggregateEvaluation', () => {
  it('validator fail이면 총점을 0점으로 반환한다', () => {
    const result = aggregateEvaluation({
      challenge: HARD_CODED_CHALLENGE,
      input: baseInput,
      validator: {
        passed: false,
        passed_requirements: ['req-1'],
        failed_requirements: [{ id: 'req-2', reason: '도메인 점 조건을 충족하지 못함' }],
        overall_reason: '요구사항 일부가 누락되었습니다.',
      },
    });

    expect(result.total_score).toBe(0);
    expect(result.validator_passed).toBe(false);
    expect(result.metricReasons[0]?.reason).toContain('요구사항 일부가 누락되었습니다.');
  });

  it('validator pass이면 100점 만점 기준으로 항목 점수를 합산한다', () => {
    const quantitative = analyzeQuantitative(baseInput, HARD_CODED_CHALLENGE.baseline);
    const result = aggregateEvaluation({
      challenge: HARD_CODED_CHALLENGE,
      input: baseInput,
      validator: {
        passed: true,
        passed_requirements: ['req-1', 'req-2', 'req-3'],
        failed_requirements: [],
        overall_reason: '모든 요구사항을 충족했습니다.',
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
        raw_runs: [
          {
            clarity: { score: 8, reason: '처음 요청이 구체적이었습니다.' },
            context: { score: 9, reason: '이전 응답을 이어서 개선했습니다.' },
            recovery: { score: 8, reason: '오류를 분명히 짚고 수정했습니다.' },
            feedback: {
              good: '맥락을 잘 이어 갔습니다.',
              improve: 'edge case를 더 빨리 제시해 보세요.',
            },
          },
        ],
        inter_run_stddev: { clarity: 0.6, context: 0.5, recovery: 0.4 },
        successful_runs: 3,
      },
      scoreDistribution: [60, 72, 81, 90],
    });

    expect(result.total_score).toBeLessThanOrEqual(100);
    expect(result.total_score).toBeGreaterThan(80);
    expect(result.scores.correctness).toBe(40);
    expect(result.scores.context).toBe(13.5);
    expect(result.scores.clarity).toBe(4);
    expect(result.scores.pattern_bonus).toBeGreaterThanOrEqual(0);
    expect(result.percentile).toBeGreaterThan(0);
    expect(result.meta.is_low_confidence).toBe(false);
  });
});
