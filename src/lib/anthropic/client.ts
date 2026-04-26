import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

// 서버 측 lazy 인스턴스. ANTHROPIC_API_KEY 미설정 시 명시적 에러.
export function getAnthropicClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY 가 설정되지 않았습니다.');
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

// 사용자 대화 모델 (CLAUDE.md / appendix.md 기준).
export const CLAUDE_MODEL = 'claude-sonnet-4-6';
