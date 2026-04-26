import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-0 text-text-1 px-4">
      <div
        className="bg-bg-1 border border-line rounded-[12px] p-7"
        style={{ maxWidth: 380 }}
      >
        <div className="font-mono text-text-3 mb-2" style={{ fontSize: 11 }}>
          404
        </div>
        <div className="text-text-1 mb-2" style={{ fontSize: 14 }}>
          페이지를 찾을 수 없습니다
        </div>
        <div className="text-text-3 mb-5" style={{ fontSize: 12 }}>
          요청한 주소가 잘못되었거나 페이지가 이동되었을 수 있습니다.
        </div>
        <Link
          href="/tasks"
          className="block text-center rounded-md bg-acc font-medium"
          style={{ padding: '10px 14px', fontSize: 13, color: 'var(--color-acc-ink)' }}
        >
          태스크 목록으로
        </Link>
      </div>
    </div>
  );
}
