'use client';

import { useEffect, useState } from 'react';
import { SlideShell } from './SlideShell';

const STAGES = [
  { n: '01', t: 'Validator', d: '요구사항 PASS/FAIL', out: 'PASS=40 · FAIL=0' },
  { n: '02', t: 'Quantitative', d: '토큰·시도·시간 + 패턴', out: '효율 30 ± 패턴 5' },
  { n: '03', t: 'Judge ×3', d: '명확성·맥락·복구 (앙상블)', out: '협업 30' },
  { n: '04', t: 'Aggregator', d: '난이도 보정 × 백분위', out: '× 1.0~1.15' },
];

export function Slide03Solution({ index, total }: { index: number; total: number }) {
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const timers = STAGES.map((_, i) => setTimeout(() => setActive(i), 600 + i * 350));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SlideShell index={index} total={total} eyebrow="02 · SOLUTION">
      <div
        className="absolute inset-0 flex flex-col justify-center"
        style={{ padding: '60px 80px' }}
      >
        <div
          className="font-mono text-text-3 mb-4"
          style={{ fontSize: 12, letterSpacing: '0.12em' }}
        >
          ─── PROMPTQUEST
        </div>
        <h2
          className="font-medium"
          style={{ fontSize: 48, lineHeight: 1.15, letterSpacing: '-0.02em' }}
        >
          실전 quest를 풀고, <span className="text-acc">4단계로 채점</span>한다.
        </h2>
        <p className="text-text-2 mt-5" style={{ fontSize: 18, lineHeight: 1.55, maxWidth: 920 }}>
          개발자는 풀이용 AI와 대화하며 실제 업무 태스크를 풀고, 결과물은 다른 모델 패밀리의 채점
          에이전트가 채점합니다 —{' '}
          <span className="text-text-1">Claude (대화) ⟂ GPT-4o-mini (채점)</span>. 자기 채점 편향을
          모델 패밀리 단위로 차단합니다.
        </p>

        <div className="grid grid-cols-4 mt-12" style={{ gap: 16, position: 'relative' }}>
          <div
            className="absolute top-1/2 left-0 right-0 border-t border-dashed border-line-2"
            style={{ transform: 'translateY(-1px)', zIndex: 0 }}
          />
          {STAGES.map((s, i) => {
            const isActive = active >= i;
            return (
              <div
                key={s.n}
                className="bg-bg-1 border rounded-[10px] transition-all duration-400 relative"
                style={{
                  padding: 22,
                  borderColor: isActive ? 'var(--color-acc-line)' : 'var(--color-line)',
                  boxShadow: isActive ? '0 0 0 1px var(--color-acc-line)' : 'none',
                  zIndex: 1,
                  background: isActive ? 'oklch(0.86 0.2 130 / 0.04)' : 'var(--color-bg-1)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="font-mono text-text-3"
                    style={{ fontSize: 10, letterSpacing: '0.08em' }}
                  >
                    STAGE {s.n}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 11,
                      color: isActive ? 'var(--color-acc)' : 'var(--color-text-4)',
                      transition: 'color 300ms',
                    }}
                  >
                    {isActive ? '●' : '○'}
                  </span>
                </div>
                <div
                  className="font-medium"
                  style={{
                    fontSize: 19,
                    color: isActive ? 'var(--color-text-1)' : 'var(--color-text-2)',
                    transition: 'color 300ms',
                  }}
                >
                  {s.t}
                </div>
                <div className="text-text-3 mt-1" style={{ fontSize: 12.5 }}>
                  {s.d}
                </div>
                <div
                  className="font-mono mt-3 pt-3 border-t border-line"
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.04em',
                    color: isActive ? 'var(--color-acc)' : 'var(--color-text-4)',
                    transition: 'color 300ms',
                  }}
                >
                  → {s.out}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mt-10">
          <span className="font-mono text-acc" style={{ fontSize: 12, letterSpacing: '0.08em' }}>
            100점 = 40 정확성 + 30 효율 + 30 협업 ± 5 패턴
          </span>
          <span className="text-text-3" style={{ fontSize: 13 }}>
            · 결과물 FAIL 시 전체 0점 (절대평가 게이팅)
          </span>
        </div>
      </div>
    </SlideShell>
  );
}
