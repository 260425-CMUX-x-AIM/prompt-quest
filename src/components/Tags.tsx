'use client';

const DIFF_MAP: Record<string, { cls: string; label: string }> = {
  easy: { cls: 'text-diff-easy border-diff-easy/35', label: 'EASY' },
  medium: { cls: 'text-diff-med border-diff-med/35', label: 'MEDIUM' },
  hard: { cls: 'text-diff-hard border-diff-hard/35', label: 'HARD' },
};

export function DiffTag({ level }: { level: string }) {
  const info = DIFF_MAP[level] || DIFF_MAP.easy;
  return (
    <span
      className={`inline-flex items-center font-mono uppercase ${info.cls}`}
      style={{
        fontSize: 11,
        letterSpacing: '0.04em',
        padding: '2px 7px',
        border: '1px solid',
        borderRadius: 3,
        background: 'var(--color-bg-1)',
      }}
    >
      {info.label}
    </span>
  );
}

export function CategoryTag({ cat }: { cat: string }) {
  return (
    <span
      className="inline-flex items-center font-mono uppercase text-text-2 border-line-2 bg-bg-1"
      style={{
        fontSize: 11,
        letterSpacing: '0.04em',
        padding: '2px 7px',
        border: '1px solid var(--color-line-2)',
        borderRadius: 3,
      }}
    >
      {cat}
    </span>
  );
}
