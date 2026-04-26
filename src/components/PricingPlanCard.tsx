import Link from 'next/link';
import type { PricingFeature } from '@/lib/pricing';

type PricingPlanCardProps = {
  name: string;
  tagline: string;
  price: string;
  period: string;
  features: PricingFeature[];
  ctaLabel: string;
  ctaHref: string;
  highlight?: boolean;
  badge?: string;
};

export default function PricingPlanCard({
  name,
  tagline,
  price,
  period,
  features,
  ctaLabel,
  ctaHref,
  highlight = false,
  badge,
}: PricingPlanCardProps) {
  return (
    <div
      className="relative flex flex-col rounded-[10px] border bg-bg-1"
      style={{
        padding: 24,
        borderColor: highlight ? 'var(--color-acc)' : 'var(--color-line)',
        background: highlight ? 'oklch(0.86 0.2 130 / 0.04)' : 'var(--color-bg-1)',
      }}
    >
      {badge && (
        <div
          className="absolute font-mono rounded-[3px] bg-acc text-acc-ink"
          style={{
            top: -10,
            left: 24,
            padding: '3px 8px',
            fontSize: 10,
            letterSpacing: '0.06em',
            fontWeight: 600,
          }}
        >
          {badge}
        </div>
      )}

      <div
        className="font-mono mb-1.5"
        style={{
          fontSize: 11,
          color: highlight ? 'var(--color-acc)' : 'var(--color-text-3)',
          letterSpacing: '0.08em',
        }}
      >
        {name}
      </div>
      <div className="mb-4 min-h-[40px] text-text-2" style={{ fontSize: 14, lineHeight: 1.5 }}>
        {tagline}
      </div>

      <div className="mb-1 flex items-end gap-1.5">
        <span
          className="font-mono font-semibold text-text-1"
          style={{ fontSize: 36, letterSpacing: '-0.02em', lineHeight: 1 }}
        >
          {price}
        </span>
        {period && (
          <span className="font-mono text-text-3" style={{ fontSize: 12 }}>
            {period}
          </span>
        )}
      </div>

      <div className="my-5 h-px bg-line" />

      <div className="mb-5 flex flex-1 flex-col gap-2.5">
        {features.map((feature) => (
          <div key={feature.text} className="flex items-start gap-2.5">
            <span
              style={{
                color: feature.disabled ? 'var(--color-text-4)' : 'var(--color-acc)',
                fontSize: 12,
                marginTop: 3,
              }}
            >
              {feature.disabled ? 'x' : 'o'}
            </span>
            <span
              style={{
                fontSize: 12.5,
                color: feature.disabled ? 'var(--color-text-4)' : 'var(--color-text-2)',
                lineHeight: 1.5,
                textDecoration: feature.disabled ? 'line-through' : 'none',
              }}
            >
              {feature.text}
              {feature.note && (
                <span className="font-mono text-text-4" style={{ fontSize: 10.5, marginLeft: 6 }}>
                  {feature.note}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      <Link
        href={ctaHref}
        className={`inline-flex w-full items-center justify-center rounded-md border transition-[filter,background-color] ${
          highlight
            ? 'border-acc bg-acc text-acc-ink hover:brightness-105'
            : 'border-line bg-transparent text-text-1 hover:bg-bg-2'
        }`}
        style={{ padding: '11px 14px', fontSize: 13, fontWeight: highlight ? 600 : 500 }}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
