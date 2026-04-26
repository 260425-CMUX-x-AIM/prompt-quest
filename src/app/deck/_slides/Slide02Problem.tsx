'use client';

import { useEffect, useState } from 'react';
import { SlideShell } from './SlideShell';

export function Slide02Problem({ index, total }: { index: number; total: number }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <SlideShell index={index} total={total} eyebrow="01 · PROBLEM">
      <div className="absolute inset-0 grid grid-cols-2" style={{ padding: '60px 80px', gap: 60 }}>
        <div className="flex flex-col justify-center">
          <div
            className="font-mono text-text-3 mb-4 transition-opacity duration-500"
            style={{ fontSize: 12, letterSpacing: '0.12em', opacity: phase >= 1 ? 1 : 0 }}
          >
            ─── THE GAP
          </div>
          <h2
            className="font-medium mb-7 transition-all duration-500"
            style={{
              fontSize: 52,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              opacity: phase >= 1 ? 1 : 0,
              transform: phase >= 1 ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            AI 활용 능력은
            <br />
            <span className="text-acc">증명할 수 없다.</span>
          </h2>
          <p
            className="text-text-2 transition-opacity duration-500"
            style={{
              fontSize: 18,
              lineHeight: 1.6,
              opacity: phase >= 2 ? 1 : 0,
              transitionDelay: '100ms',
            }}
          >
            전 세계 개발자 85%가 AI 도구를 정기적으로 사용하지만, {'"AI를 잘 다루는 사람"'}을 가려낼
            객관적 지표는 없습니다. 기존 코딩테스트는 AI 사용을 금지하고, 면접관의 감으로
            평가됩니다.
          </p>
        </div>

        <div className="flex flex-col justify-center">
          <div
            className="bg-bg-1 border border-line rounded-[12px] overflow-hidden transition-all duration-500"
            style={{
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? 'translateY(0)' : 'translateY(12px)',
            }}
          >
            <div
              className="border-b border-line bg-bg-2 flex items-center justify-between"
              style={{ padding: '12px 18px' }}
            >
              <span
                className="font-mono text-text-3"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                ─── EVIDENCE
              </span>
              <span
                className="font-mono text-text-3"
                style={{ fontSize: 10, letterSpacing: '0.08em' }}
              >
                JETBRAINS DEV ECOSYSTEM 2025 · n=24,534
              </span>
            </div>
            <div className="grid grid-cols-3" style={{ padding: '28px 24px', gap: 20 }}>
              {[
                { v: '85%', l: '개발자가 AI 도구 정기 사용' },
                { v: '23%', l: 'AI 사용자 1순위 우려: 생성 코드 품질' },
                { v: '0', l: 'AI 활용 능력 표준 지표' },
              ].map((s, i) => (
                <div key={s.l} className="flex flex-col">
                  <div
                    className="font-mono font-semibold text-acc transition-all duration-500"
                    style={{
                      fontSize: 44,
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                      opacity: phase >= 3 ? 1 : 0,
                      transform: phase >= 3 ? 'translateY(0)' : 'translateY(8px)',
                      transitionDelay: `${i * 120}ms`,
                    }}
                  >
                    {s.v}
                  </div>
                  <div className="text-text-3 mt-2" style={{ fontSize: 12, lineHeight: 1.4 }}>
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-line bg-bg-0" style={{ padding: '14px 24px' }}>
              <span className="font-mono text-text-2" style={{ fontSize: 12 }}>
                <span className="text-acc">→</span> 85%가 쓰지만, 그 활용 능력을 검증할 도구가 없다.
              </span>
            </div>
          </div>

          <div
            className="mt-5 transition-opacity duration-500"
            style={{ opacity: phase >= 3 ? 1 : 0, transitionDelay: '400ms' }}
          >
            <span
              className="font-mono text-text-3"
              style={{ fontSize: 12, letterSpacing: '0.06em' }}
            >
              ICP: 주니어/미들 개발자 + AI 도입 중인 팀 (B2B)
            </span>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
