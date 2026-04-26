import { beforeEach, describe, expect, it, vi } from 'vitest';

const validateArtifactMock = vi.fn();
const analyzeQuantitativeMock = vi.fn();
const judgeConversationMock = vi.fn();

vi.mock('@/lib/evaluation/providers', async () => {
  const actual = await vi.importActual<object>('@/lib/evaluation/providers');

  return {
    ...actual,
    getEvaluationProviderConfig: () => ({
      provider: 'openai' as const,
      validatorModel: 'gpt-4.1-mini',
      judgeModel: 'gpt-4.1-mini',
      apiKey: 'test',
    }),
  };
});

vi.mock('@/lib/evaluation/validator', () => ({
  validateArtifact: validateArtifactMock,
}));

vi.mock('@/lib/evaluation/quantitative', () => ({
  analyzeQuantitative: analyzeQuantitativeMock,
}));

vi.mock('@/lib/evaluation/judge', () => ({
  judgeConversation: judgeConversationMock,
}));

describe('runEvaluationPipeline', () => {
  beforeEach(() => {
    validateArtifactMock.mockReset();
    analyzeQuantitativeMock.mockReset();
    judgeConversationMock.mockReset();
  });

  it('validator fail이면 Stage 2~3 호출을 건너뛴다', async () => {
    validateArtifactMock.mockResolvedValue({
      passed: false,
      passed_requirements: [],
      failed_requirements: [{ id: 'req-1', reason: '요구사항을 충족하지 못했습니다.' }],
      overall_reason: '제출물이 미완성입니다.',
    });

    const { runEvaluationPipeline } = await import('@/lib/evaluation');
    const result = await runEvaluationPipeline({
      slug: 'regex-email-001',
      artifact: 'const EMAIL_REGEX = /.*/g;',
      messages: [{ role: 'user', content: '정규식을 만들어줘.' }],
      usage: {
        input_tokens: 100,
        output_tokens: 80,
      },
      elapsed_seconds: 90,
      attempt_count: 1,
    });

    expect(analyzeQuantitativeMock).not.toHaveBeenCalled();
    expect(judgeConversationMock).not.toHaveBeenCalled();
    expect(result.total_score).toBe(0);
    expect(result.validator_passed).toBe(false);
  });
});
