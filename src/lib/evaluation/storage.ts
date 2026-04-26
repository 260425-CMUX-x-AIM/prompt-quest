import { useSyncExternalStore } from 'react';
import type { EvaluationInput, EvaluationResult } from '@/lib/evaluation/types';

const PENDING_KEY = 'promptquest:pending-evaluation';
let pendingSnapshotCache: { raw: string | null; value: EvaluationInput | null } | null = null;
const resultSnapshotCache = new Map<
  string,
  { raw: string | null; value: EvaluationResult | null }
>();

function getResultKey(slug: string): string {
  return `promptquest:evaluation-result:${slug}`;
}

export function savePendingEvaluation(input: EvaluationInput): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(input));
}

export function readPendingEvaluation(): EvaluationInput | null {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(PENDING_KEY);
  if (!raw) {
    pendingSnapshotCache = { raw: null, value: null };
    return null;
  }

  if (pendingSnapshotCache?.raw === raw) {
    return pendingSnapshotCache.value;
  }

  try {
    const parsed = normalizePendingEvaluation(JSON.parse(raw));
    pendingSnapshotCache = { raw, value: parsed };
    return parsed;
  } catch {
    window.sessionStorage.removeItem(PENDING_KEY);
    pendingSnapshotCache = { raw: null, value: null };
    return null;
  }
}

export function clearPendingEvaluation(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(PENDING_KEY);
  pendingSnapshotCache = { raw: null, value: null };
}

export function saveEvaluationResult(result: EvaluationResult): void {
  if (typeof window === 'undefined') return;
  const raw = JSON.stringify(result);
  window.sessionStorage.setItem(getResultKey(result.slug), raw);
  resultSnapshotCache.set(result.slug, { raw, value: result });
}

export function readEvaluationResult(slug: string): EvaluationResult | null {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(getResultKey(slug));
  if (!raw) {
    resultSnapshotCache.set(slug, { raw: null, value: null });
    return null;
  }

  const cached = resultSnapshotCache.get(slug);
  if (cached?.raw === raw) {
    return cached.value;
  }

  try {
    const parsed = normalizeEvaluationResult(JSON.parse(raw));
    resultSnapshotCache.set(slug, { raw, value: parsed });
    return parsed;
  } catch {
    window.sessionStorage.removeItem(getResultKey(slug));
    resultSnapshotCache.set(slug, { raw: null, value: null });
    return null;
  }
}

function normalizePendingEvaluation(value: unknown): EvaluationInput {
  const candidate = value as Partial<EvaluationInput> & {
    elapsedSeconds?: number;
    attemptCount?: number;
    usage?: Partial<EvaluationInput['usage']> & {
      inputTokens?: number;
      outputTokens?: number;
    };
  };

  return {
    slug: candidate.slug ?? '',
    artifact: candidate.artifact ?? '',
    messages: Array.isArray(candidate.messages)
      ? candidate.messages.filter(
          (message): message is EvaluationInput['messages'][number] =>
            !!message &&
            (message.role === 'user' || message.role === 'assistant') &&
            typeof message.content === 'string',
        )
      : [],
    usage: {
      input_tokens: candidate.usage?.input_tokens ?? candidate.usage?.inputTokens ?? 0,
      output_tokens: candidate.usage?.output_tokens ?? candidate.usage?.outputTokens ?? 0,
    },
    elapsed_seconds: candidate.elapsed_seconds ?? candidate.elapsedSeconds ?? 0,
    attempt_count: candidate.attempt_count ?? candidate.attemptCount ?? 1,
  };
}

function normalizeEvaluationResult(value: unknown): EvaluationResult {
  const candidate = value as Partial<EvaluationResult> & {
    totalScore?: number;
    validatorPassed?: boolean;
    summary?: Partial<EvaluationResult['summary']> & {
      attemptCount?: number;
      elapsedSeconds?: number;
      totalTokens?: number;
      messageCount?: number;
    };
  };

  return {
    ...(candidate as EvaluationResult),
    total_score: candidate.total_score ?? candidate.totalScore ?? 0,
    validator_passed: candidate.validator_passed ?? candidate.validatorPassed ?? false,
    summary: {
      attempt_count: candidate.summary?.attempt_count ?? candidate.summary?.attemptCount ?? 0,
      elapsed_seconds: candidate.summary?.elapsed_seconds ?? candidate.summary?.elapsedSeconds ?? 0,
      total_tokens: candidate.summary?.total_tokens ?? candidate.summary?.totalTokens ?? 0,
      message_count: candidate.summary?.message_count ?? candidate.summary?.messageCount ?? 0,
    },
  };
}

function subscribeToStorage(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleChange = () => onStoreChange();

  window.addEventListener('storage', handleChange);
  window.addEventListener('focus', handleChange);
  window.addEventListener('pageshow', handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener('focus', handleChange);
    window.removeEventListener('pageshow', handleChange);
  };
}

export function usePendingEvaluation(): EvaluationInput | null {
  return useSyncExternalStore(subscribeToStorage, readPendingEvaluation, () => null);
}

export function useEvaluationResult(slug: string): EvaluationResult | null {
  return useSyncExternalStore(
    subscribeToStorage,
    () => readEvaluationResult(slug),
    () => null,
  );
}
