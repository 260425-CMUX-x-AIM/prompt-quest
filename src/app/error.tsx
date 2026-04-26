'use client';

import { useEffect } from 'react';

// App-level 에러 바운더리. 세그먼트 단위 error.tsx 가 없는 경로의 에러를 받음.
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-0 text-text-1 px-4">
      <div
        className="bg-bg-1 border border-line rounded-[12px] p-7"
        style={{ maxWidth: 380 }}
      >
        <div className="text-text-1 mb-2" style={{ fontSize: 14 }}>
          일시적인 오류가 발생했습니다
        </div>
        <div className="text-text-3 mb-5" style={{ fontSize: 12, lineHeight: 1.5 }}>
          잠시 후 다시 시도해 주세요. 문제가 반복되면 운영자에게 문의해 주세요.
        </div>
        <button
          onClick={reset}
          className="rounded-md bg-acc font-medium w-full"
          style={{ padding: '10px 14px', fontSize: 13, color: 'var(--color-acc-ink)' }}
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
