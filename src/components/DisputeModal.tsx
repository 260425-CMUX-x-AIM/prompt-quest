'use client';

import { useState, type FormEvent } from 'react';
import type { CreateDisputeRequest, DisputeReason } from '@/lib/api/contracts';

const REASON_LABELS: Record<DisputeReason, string> = {
  score_too_low: '점수가 낮음',
  score_too_high: '점수가 높음',
  bad_feedback: '피드백 부적절',
  other: '기타',
};

// 분쟁 신청 모달. 사양: docs/07-screen-flow.md §7.4
// B 의 POST /api/evaluations/[id]/disputes 호출.
export function DisputeModal({
  evaluationId,
  onClose,
}: {
  evaluationId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<DisputeReason>('score_too_low');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: CreateDisputeRequest = {
        reason,
        user_comment: comment.trim() || undefined,
      };
      const res = await fetch(`/api/evaluations/${evaluationId}/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError('제출에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        setLoading(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError('제출에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-black/50 z-50">
        <div
          className="bg-bg-1 border border-line rounded-[12px] p-6"
          style={{ width: 380 }}
        >
          <div className="text-text-1 mb-3" style={{ fontSize: 14 }}>
            분쟁 신청이 접수되었습니다
          </div>
          <div className="text-text-3 mb-5" style={{ fontSize: 12 }}>
            운영자 검토 후 결과를 알려드릴게요.
          </div>
          <button
            onClick={onClose}
            className="rounded-md bg-acc font-medium w-full"
            style={{ padding: '10px 14px', fontSize: 13, color: 'var(--color-acc-ink)' }}
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 grid place-items-center bg-black/50 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-bg-1 border border-line rounded-[12px] p-6 flex flex-col gap-4"
        style={{ width: 380 }}
      >
        <div className="text-text-1" style={{ fontSize: 14 }}>
          이 채점에 이의가 있나요?
        </div>
        <div className="flex flex-col gap-2">
          {(Object.keys(REASON_LABELS) as DisputeReason[]).map((r) => (
            <label
              key={r}
              className="flex items-center gap-2 cursor-pointer text-text-2"
              style={{ fontSize: 13 }}
            >
              <input
                type="radio"
                name="reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
              />
              {REASON_LABELS[r]}
            </label>
          ))}
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
            상세 의견 (선택)
          </span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="rounded-md bg-bg-2 border border-line outline-none focus:border-acc"
            style={{ padding: '10px 12px', fontSize: 13, resize: 'vertical' }}
          />
        </label>
        {error && (
          <div className="text-err font-mono" style={{ fontSize: 11.5 }}>
            {error}
          </div>
        )}
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-line text-text-2 flex-1"
            style={{ padding: '10px 14px', fontSize: 13 }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-acc font-medium flex-1 disabled:opacity-50"
            style={{ padding: '10px 14px', fontSize: 13, color: 'var(--color-acc-ink)' }}
          >
            {loading ? '제출 중…' : '제출'}
          </button>
        </div>
      </form>
    </div>
  );
}
