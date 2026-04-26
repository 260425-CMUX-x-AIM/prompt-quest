'use client';

export default function Logo({ size = 14 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size + 4} height={size + 4} viewBox="0 0 20 20" fill="none">
        <rect x="1" y="1" width="18" height="18" rx="3" stroke="var(--color-acc)" strokeWidth="1.4" />
        <path
          d="M5 7 L8 10 L5 13"
          stroke="var(--color-acc)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M10 13 H15" stroke="var(--color-acc)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span
        className="font-mono font-semibold"
        style={{ fontSize: size, letterSpacing: '0.02em' }}
      >
        prompt<span className="text-acc">quest</span>
      </span>
    </div>
  );
}
