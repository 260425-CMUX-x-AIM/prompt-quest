import type { ChallengeBaseline } from '@/lib/challenge';
import type {
  EvaluationInput,
  EvaluationMessage,
  QuantitativeResult,
} from '@/lib/evaluation/types';

export function analyzeQuantitative(
  input: EvaluationInput,
  baseline: ChallengeBaseline,
): QuantitativeResult {
  const totalTokens = input.usage.inputTokens + input.usage.outputTokens;
  const tokenScore = ratioToScore(baseline.totalTokens, Math.max(totalTokens, 1), 12);
  const attemptScore = ratioToScore(baseline.attempts, Math.max(input.attemptCount, 1), 12);
  const timeScore = ratioToScore(baseline.timeSeconds, Math.max(input.elapsedSeconds, 1), 6);
  const patterns = analyzePatterns(input.messages);

  let total = tokenScore + attemptScore + timeScore;

  if (patterns.redundancyRatio > 0.45) total -= 2;
  if (patterns.avgUserMessageLength < 18) total -= 1;
  if (patterns.contextReferenceCount > 0) total += 1;

  return {
    efficiency: {
      tokenScore,
      attemptScore,
      timeScore,
      total: clamp(total, 0, 30),
      baseline,
    },
    patterns,
    reasons: {
      token: `총 ${totalTokens.toLocaleString()}토큰 사용 · 기준 ${baseline.totalTokens.toLocaleString()}토큰`,
      attempt: `${input.attemptCount}회 시도 · 기준 ${baseline.attempts}회`,
      time: `${formatSeconds(input.elapsedSeconds)} 소요 · 기준 ${formatSeconds(baseline.timeSeconds)}`,
    },
  };
}

function ratioToScore(baseline: number, actual: number, maxScore: number): number {
  if (baseline <= 0 || actual <= 0) return 0;
  return round(clamp((baseline / actual) * maxScore, 0, maxScore));
}

function analyzePatterns(messages: EvaluationMessage[]) {
  const userMessages = messages.filter((message) => message.role === 'user');

  if (userMessages.length === 0) {
    return {
      redundancyRatio: 0,
      contextReferenceCount: 0,
      avgUserMessageLength: 0,
      errorRecoveryAttempts: 0,
    };
  }

  let redundancyHits = 0;
  for (let index = 1; index < userMessages.length; index += 1) {
    if (jaccardSimilarity(userMessages[index].content, userMessages[index - 1].content) > 0.72) {
      redundancyHits += 1;
    }
  }

  const contextPattern =
    /(그거|그것|위에서|방금|앞서|이전|그 코드|그 함수|수정해|바꿔|추가로|that|previous|above|earlier|the (?:code|function|previous))/gi;
  const errorPattern = /(틀렸|잘못|에러|오류|아니야|다시|wrong|incorrect|error|fix)/gi;

  return {
    redundancyRatio:
      userMessages.length > 1 ? round(redundancyHits / (userMessages.length - 1)) : 0,
    contextReferenceCount: userMessages.reduce(
      (sum, message) => sum + (message.content.match(contextPattern) || []).length,
      0,
    ),
    avgUserMessageLength: round(
      userMessages.reduce((sum, message) => sum + message.content.length, 0) / userMessages.length,
    ),
    errorRecoveryAttempts: userMessages.filter((message) => errorPattern.test(message.content))
      .length,
  };
}

function jaccardSimilarity(left: string, right: string): number {
  const leftTokens = new Set(left.toLowerCase().split(/\s+/).filter(Boolean));
  const rightTokens = new Set(right.toLowerCase().split(/\s+/).filter(Boolean));

  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return intersection / union;
}

function formatSeconds(seconds: number): string {
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
