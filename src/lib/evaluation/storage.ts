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
    const parsed = JSON.parse(raw) as EvaluationInput;
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
    const parsed = JSON.parse(raw) as EvaluationResult;
    resultSnapshotCache.set(slug, { raw, value: parsed });
    return parsed;
  } catch {
    window.sessionStorage.removeItem(getResultKey(slug));
    resultSnapshotCache.set(slug, { raw: null, value: null });
    return null;
  }
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
