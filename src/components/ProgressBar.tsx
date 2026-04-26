'use client';

export default function ProgressBar({
  value,
  max = 100,
  color = 'var(--color-acc)',
  height = 4,
}: {
  value: number;
  max?: number;
  color?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="rounded-full overflow-hidden" style={{ height, background: 'var(--color-bg-3)' }}>
      <div
        className="h-full transition-[width] duration-200"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}
