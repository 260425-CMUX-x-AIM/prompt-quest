interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}

function getRange(page: number, total: number, pageSize: number) {
  if (total === 0) return '0';
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return `${from}-${to}`;
}

export default function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  itemLabel = 'items',
  className = '',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  if (totalPages <= 1 && total === 0) return null;

  return (
    <div
      className={`flex items-center justify-between gap-3 ${className}`}
      style={{ fontSize: 12 }}
    >
      <div className="font-mono text-text-3">
        {getRange(page, total, pageSize)} / {total} {itemLabel}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          className="font-mono rounded border border-line text-text-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-2"
          style={{ padding: '6px 10px', fontSize: 11 }}
        >
          이전
        </button>
        <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          className="font-mono rounded border border-line text-text-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-2"
          style={{ padding: '6px 10px', fontSize: 11 }}
        >
          다음
        </button>
      </div>
    </div>
  );
}
