import type { ApiErrorCode } from '@/lib/api/contracts';

// 코드 → 한국어 카피 매핑. 사양: docs/part-a-plan.md Day 8 + 06-api-endpoints.md §6.4
export const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  UNAUTHORIZED: '로그인이 필요합니다. 다시 로그인해 주세요.',
  FORBIDDEN: '이 작업에 대한 권한이 없습니다.',
  INVALID_INPUT: '입력 형식이 올바르지 않습니다.',
  SESSION_INVALID: '세션 상태가 유효하지 않습니다. 세션을 다시 시작해 주세요.',
  MESSAGE_LIMIT_EXCEEDED: '메시지 한도(50개)에 도달했습니다. 새 세션을 시작해 주세요.',
  RATE_LIMITED: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  EVALUATION_FAILED: '채점이 실패했습니다. 다시 제출하거나 분쟁을 신청해 주세요.',
  INTERNAL_ERROR: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
};

// 알 수 없는 코드는 INTERNAL_ERROR 카피로 폴백.
export function getErrorMessage(code: ApiErrorCode | string | undefined | null): string {
  if (!code) return ERROR_MESSAGES.INTERNAL_ERROR;
  const map = ERROR_MESSAGES as Record<string, string>;
  return map[code] ?? ERROR_MESSAGES.INTERNAL_ERROR;
}
