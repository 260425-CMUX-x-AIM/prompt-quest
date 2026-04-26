'use client';

import { useState } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import PricingPlanCard from '@/components/PricingPlanCard';
import { YEARLY_DISCOUNT, individualPlans, pricingFaqs, type BillingCycle } from '@/lib/pricing';

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingCycle>('yearly');

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-0 text-text-1">
      <NavBar />
      <div className="custom-scroll flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1100px]" style={{ padding: '52px 36px 60px' }}>
          <div className="mb-9 text-center">
            <div
              className="mb-3 font-mono text-acc"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              PRICING
            </div>
            <h1 className="mb-3 font-medium" style={{ fontSize: 40, letterSpacing: '-0.02em' }}>
              먼저 체험해보고 결정하세요.
            </h1>
            <p
              className="mx-auto max-w-[560px] text-text-2"
              style={{ fontSize: 15, lineHeight: 1.55 }}
            >
              모든 플랜은 14일 무료 트라이얼을 포함하는 데모 흐름입니다. 실제 결제 연동 없이 화면과
              상태를 먼저 검증할 수 있어요.
            </p>
          </div>

          <div className="mb-7 flex justify-center">
            <div className="flex rounded-md border border-line bg-bg-1 p-[3px]">
              {[
                ['monthly', '월간'],
                ['yearly', `연간 · ${YEARLY_DISCOUNT} 절약`],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setBilling(key as BillingCycle)}
                  className="flex items-center gap-1.5 rounded-[4px]"
                  style={{
                    padding: '7px 16px',
                    fontSize: 12.5,
                    background: billing === key ? 'var(--color-bg-3)' : 'transparent',
                    color: billing === key ? 'var(--color-text-1)' : 'var(--color-text-3)',
                    fontWeight: billing === key ? 500 : 400,
                  }}
                >
                  {label}
                  {key === 'yearly' && (
                    <span className="font-mono text-acc" style={{ fontSize: 9 }}>
                      SAVE
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-14 grid gap-4 lg:grid-cols-3">
            {individualPlans.map((plan) => (
              <PricingPlanCard
                key={plan.name}
                name={plan.name}
                tagline={plan.tagline}
                price={billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice}
                period={billing === 'yearly' ? plan.yearlyPeriod : plan.monthlyPeriod}
                features={plan.features}
                ctaLabel={plan.ctaLabel}
                ctaHref={plan.ctaHref}
                highlight={plan.highlight}
                badge={plan.badge}
              />
            ))}
          </div>

          <div
            className="relative mb-14 overflow-hidden rounded-[10px] border border-line-2 bg-bg-1"
            style={{ padding: '28px 32px' }}
          >
            <div
              className="bg-grid absolute inset-0 opacity-15"
              style={{
                maskImage: 'radial-gradient(ellipse at 100% 50%, black 20%, transparent 70%)',
                WebkitMaskImage: 'radial-gradient(ellipse at 100% 50%, black 20%, transparent 70%)',
              }}
            />
            <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div
                  className="mb-2 font-mono text-acc"
                  style={{ fontSize: 11, letterSpacing: '0.08em' }}
                >
                  FOR TEAMS
                </div>
                <h2 className="mb-1.5 font-medium" style={{ fontSize: 22 }}>
                  기업 플랜도 같이 준비했어요.
                </h2>
                <p
                  className="max-w-[560px] text-text-2"
                  style={{ fontSize: 13.5, lineHeight: 1.55 }}
                >
                  구성원의 AI 활용 역량을 측정하고 팀 단위 트레이닝 커리큘럼까지 운영하는
                  엔터프라이즈 흐름을 별도 화면으로 정리했습니다.
                </p>
              </div>
              <Link
                href="/pricing/business"
                className="inline-flex items-center justify-center rounded-md border border-line bg-bg-2 text-text-1 hover:bg-bg-3"
                style={{ padding: '11px 18px', fontSize: 13, fontWeight: 500 }}
              >
                기업 플랜 보기
              </Link>
            </div>
          </div>

          <div>
            <div
              className="mb-4 text-center font-mono text-text-3"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              자주 묻는 질문
            </div>
            <div className="grid gap-2.5 md:grid-cols-2">
              {pricingFaqs.map((item) => (
                <div key={item.question} className="rounded-[10px] border border-line bg-bg-1 p-4">
                  <div className="mb-1 font-medium" style={{ fontSize: 13 }}>
                    {item.question}
                  </div>
                  <div className="text-text-3" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                    {item.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
