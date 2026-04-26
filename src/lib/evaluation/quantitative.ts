import type { ChallengeBaseline } from '@/lib/challenge';
import type { EvaluationInput, EvaluationMessage } from '@/lib/evaluation/types';
import type { QuantitativeResult } from '@/lib/types/evaluation';

export function analyzeQuantitative(
  input: EvaluationInput,
  baseline: ChallengeBaseline,
  baselineSource: QuantitativeResult['efficiency']['baseline_source'] = 'estimated',
): QuantitativeResult {
  const totalTokens = input.usage.input_tokens + input.usage.output_tokens;
  const tokenScore = ratioToScore(baseline.totalTokens, Math.max(totalTokens, 1), 12);
  const attemptScore = ratioToScore(baseline.attempts, Math.max(input.attempt_count, 1), 12);
  const timeScore = ratioToScore(baseline.timeSeconds, Math.max(input.elapsed_seconds, 1), 6);
  const patterns = analyzePatterns(input.messages);
  const patternAdjustment = computePatternAdjustment(patterns, input.messages.length);
  const total = clamp(tokenScore + attemptScore + timeScore, 0, 30);

  return {
    efficiency: {
      token_score: tokenScore,
      attempt_score: attemptScore,
      time_score: timeScore,
      total,
      baseline_source: baselineSource,
    },
    patterns,
    pattern_adjustment: patternAdjustment,
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
      redundancy_ratio: 0,
      context_reference_count: 0,
      avg_user_message_length: 0,
      error_recovery_attempts: 0,
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
    redundancy_ratio:
      userMessages.length > 1 ? round(redundancyHits / (userMessages.length - 1)) : 0,
    context_reference_count: userMessages.reduce(
      (sum, message) => sum + (message.content.match(contextPattern) || []).length,
      0,
    ),
    avg_user_message_length: round(
      userMessages.reduce((sum, message) => sum + message.content.length, 0) / userMessages.length,
    ),
    error_recovery_attempts: userMessages.filter((message) => errorPattern.test(message.content))
      .length,
  };
}

function computePatternAdjustment(
  patterns: QuantitativeResult['patterns'],
  messageCount: number,
): number {
  let adjustment = 0;

  if (patterns.redundancy_ratio > 0.5) adjustment -= 3;
  else if (patterns.redundancy_ratio > 0.3) adjustment -= 1;

  const contextPerMessage =
    messageCount > 0 ? patterns.context_reference_count / Math.max(messageCount, 1) : 0;
  if (contextPerMessage >= 0.3) adjustment += 2;
  else if (patterns.context_reference_count > 0) adjustment += 1;

  if (patterns.avg_user_message_length < 18) adjustment -= 1;
  if (patterns.error_recovery_attempts >= 2) adjustment += 1;

  return clamp(round(adjustment), -5, 5);
}

function jaccardSimilarity(left: string, right: string): number {
  const leftTokens = new Set(left.toLowerCase().split(/\s+/).filter(Boolean));
  const rightTokens = new Set(right.toLowerCase().split(/\s+/).filter(Boolean));

  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return intersection / union;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
