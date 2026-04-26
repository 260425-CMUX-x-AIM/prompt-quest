'use client';

export default function StatChip({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-bg-1 border border-line" style={{ padding: '6px 10px' }}>
      <div
        className="font-mono uppercase"
        style={{ fontSize: 9, color: 'var(--color-text-3)', letterSpacing: '0.06em' }}
      >
        {label}
      </div>
      <div
        className="font-mono font-medium"
        style={{ fontSize: 13, color: accent ? 'var(--color-acc)' : 'var(--color-text-1)' }}
      >
        {value}
      </div>
    </div>
  );
}
