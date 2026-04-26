'use client';

import { useEffect, useState } from 'react';
import { SlideShell } from './SlideShell';

const ROWS: { label: string; old: string; pq: string }[] = [
  { label: 'AI 사용', old: '금지', pq: '필수 — 모든 풀이가 AI 협업' },
  { label: '평가 신호', old: '정답률 only', pq: '정확성 40 + 효율 30 + 협업 30 ± 패턴 5' },
  {
    label: '편향',
    old: '동일 AI 자기 채점',
    pq: '풀이 에이전트와 채점 에이전트를 분리',
  },
  { label: '재현성', old: '면접관 직감', pq: '3회 앙상블 σ<5 · 골든 셋 MAE<8 회귀' },
];

export function Slide05Why({ index, total }: { index: number; total: number }) {
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    const timers = ROWS.map((_, i) => setTimeout(() => setRevealed(i + 1), 300 + i * 280));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SlideShell index={index} total={total} eyebrow="04 · WHY 10×">
      <div
        className="absolute inset-0 flex flex-col justify-center"
        style={{ padding: '60px 80px' }}
      >
        <div
          className="font-mono text-text-3 mb-4"
          style={{ fontSize: 12, letterSpacing: '0.12em' }}
        >
          ─── AI IS THE PRODUCT
        </div>
        <h2
          className="font-medium"
          style={{ fontSize: 46, lineHeight: 1.15, letterSpacing: '-0.02em' }}
        >
          AI 없이는 <span className="text-acc">존재할 수 없는</span> 평가.
        </h2>
        <p className="text-text-2 mt-4" style={{ fontSize: 17, lineHeight: 1.55, maxWidth: 880 }}>
          기존 코딩테스트는 AI를 적으로 봅니다. PromptQuest는 AI 협업 자체를 측정합니다.
        </p>

        <div
          className="bg-bg-1 border border-line rounded-[12px] mt-10 overflow-hidden"
          style={{ maxWidth: 1080 }}
        >
          <div
            className="grid border-b border-line bg-bg-2"
            style={{ gridTemplateColumns: '180px 1fr 1.4fr', padding: '14px 20px' }}
          >
            <span
              className="font-mono text-text-3"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              CRITERION
            </span>
            <span
              className="font-mono text-text-3"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              기존 코딩테스트
            </span>
            <span className="font-mono text-acc" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
              PROMPTQUEST
            </span>
          </div>
          {ROWS.map((r, i) => {
            const visible = revealed > i;
            return (
              <div
                key={r.label}
                className="grid border-b border-line transition-all duration-400"
                style={{
                  gridTemplateColumns: '180px 1fr 1.4fr',
                  padding: '18px 20px',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(6px)',
                }}
              >
                <span
                  className="font-mono text-text-2"
                  style={{ fontSize: 13, letterSpacing: '0.04em' }}
                >
                  {r.label}
                </span>
                <span className="text-text-3" style={{ fontSize: 14, lineHeight: 1.5 }}>
                  {r.old}
                </span>
                <span className="text-text-1" style={{ fontSize: 14, lineHeight: 1.5 }}>
                  <span className="text-acc">→</span> {r.pq}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </SlideShell>
  );
}
