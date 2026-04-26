'use client';

import { useState } from 'react';
import NavBar from '@/components/NavBar';
import PricingPlanCard from '@/components/PricingPlanCard';
import { teamFeatureHighlights, teamPlans } from '@/lib/pricing';

const TEAM_PRICE = 14000;

export default function PricingBusinessPage() {
  const [seats, setSeats] = useState(20);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-0 text-text-1">
      <NavBar />
      <div className="custom-scroll flex-1 overflow-y-auto">
        <div
          className="relative overflow-hidden border-b border-line"
          style={{ padding: '52px 36px 40px' }}
        >
          <div
            className="bg-grid absolute inset-0 opacity-20"
            style={{
              maskImage: 'radial-gradient(ellipse at 30% 30%, black 20%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse at 30% 30%, black 20%, transparent 70%)',
            }}
          />
          <div className="relative mx-auto max-w-[1100px]">
            <div
              className="mb-4 font-mono text-acc"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              FOR TEAMS · ENTERPRISE
            </div>
            <h1
              className="mb-3 font-medium"
              style={{ fontSize: 46, lineHeight: 1.1, letterSpacing: '-0.02em' }}
            >
              구성원의 AI 활용 능력,
              <br />팀 단위로 측정하고 끌어올리세요.
            </h1>
            <p
              className="mb-7 max-w-[640px] text-text-2"
              style={{ fontSize: 16, lineHeight: 1.55 }}
            >
              트레이닝과 정량 평가를 묶은 팀용 PromptQuest 화면입니다. 데모 기준으로 좌석 계산기,
              플랜 비교, 보안/운영 기능 카피까지 포함합니다.
            </p>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                ['+34%', '평균 코드 리뷰 통과율'],
                ['-41%', '디버깅 평균 소요 시간'],
                ['+18pt', '신입 6주차 평가 점수'],
                ['2.4x', 'AI 도구 채택 속도'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-md border border-line bg-bg-1 p-4">
                  <div className="mb-1 font-mono font-semibold text-acc" style={{ fontSize: 22 }}>
                    {value}
                  </div>
                  <div className="text-text-2" style={{ fontSize: 11.5, lineHeight: 1.4 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1100px]" style={{ padding: '48px 36px 60px' }}>
          <div
            className="mb-2 font-mono text-text-3"
            style={{ fontSize: 11, letterSpacing: '0.08em' }}
          >
            BUSINESS PLANS
          </div>
          <h2 className="mb-7 font-medium" style={{ fontSize: 26 }}>
            팀 규모에 맞는 플랜.
          </h2>

          <div className="mb-14 grid gap-4 lg:grid-cols-3">
            {teamPlans.map((plan) => (
              <PricingPlanCard
                key={plan.name}
                name={plan.name}
                tagline={plan.tagline}
                price={plan.yearlyPrice}
                period={plan.yearlyPeriod}
                features={plan.features}
                ctaLabel={plan.ctaLabel}
                ctaHref={plan.ctaHref}
                highlight={plan.highlight}
                badge={plan.badge}
              />
            ))}
          </div>

          <div className="mb-14 rounded-[10px] border border-line bg-bg-1 p-7">
            <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
              <div>
                <div
                  className="mb-2 font-mono text-text-3"
                  style={{ fontSize: 11, letterSpacing: '0.08em' }}
                >
                  ESTIMATE
                </div>
                <h3 className="mb-1.5 font-medium" style={{ fontSize: 20 }}>
                  예상 비용 계산
                </h3>
                <p className="mb-5 text-text-3" style={{ fontSize: 13, lineHeight: 1.5 }}>
                  TEAM 플랜 기준이며 연간 결제 시 20% 할인된 월 환산 금액을 보여줍니다.
                </p>

                <div className="mb-3 flex items-center gap-3.5">
                  <span className="min-w-20 text-text-2" style={{ fontSize: 13 }}>
                    구성원 수
                  </span>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    value={seats}
                    onChange={(event) => setSeats(Number(event.target.value))}
                    className="flex-1 accent-acc"
                  />
                  <span
                    className="min-w-12 text-right font-mono font-semibold text-acc"
                    style={{ fontSize: 16 }}
                  >
                    {seats}명
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[10, 25, 50, 100, 150].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSeats(value)}
                      className="rounded border font-mono"
                      style={{
                        padding: '4px 9px',
                        fontSize: 11,
                        background: seats === value ? 'var(--color-acc-dim)' : 'var(--color-bg-2)',
                        color: seats === value ? 'var(--color-acc)' : 'var(--color-text-3)',
                        borderColor:
                          seats === value ? 'var(--color-acc-line)' : 'var(--color-line-2)',
                      }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-line lg:border-l lg:pl-7">
                <div className="mb-1.5 font-mono text-text-3" style={{ fontSize: 10.5 }}>
                  월 청구액 (연간 결제)
                </div>
                <div
                  className="font-mono font-semibold text-text-1"
                  style={{ fontSize: 32, letterSpacing: '-0.02em' }}
                >
                  ₩{Math.round(seats * TEAM_PRICE * 0.8).toLocaleString()}
                </div>
                <div className="mt-1 font-mono text-text-3" style={{ fontSize: 11 }}>
                  월간 결제 시 ₩{(seats * TEAM_PRICE).toLocaleString()}
                </div>
                <div className="my-4 h-px bg-line" />
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-md border border-acc bg-acc text-acc-ink hover:brightness-105"
                  style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600 }}
                >
                  영업팀과 상담
                </button>
              </div>
            </div>
          </div>

          <div
            className="mb-4 font-mono text-text-3"
            style={{ fontSize: 11, letterSpacing: '0.08em' }}
          >
            BUILT FOR TEAMS
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {teamFeatureHighlights.map((feature) => (
              <div key={feature.id} className="rounded-[10px] border border-line bg-bg-1 p-5">
                <div
                  className="mb-3 font-mono text-acc"
                  style={{ fontSize: 11, letterSpacing: '0.08em' }}
                >
                  {feature.id}
                </div>
                <div className="mb-1.5 font-medium" style={{ fontSize: 14.5 }}>
                  {feature.title}
                </div>
                <div className="text-text-3" style={{ fontSize: 12.5, lineHeight: 1.55 }}>
                  {feature.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
