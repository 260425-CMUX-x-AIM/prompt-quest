'use client';

import { useEffect, useState } from 'react';
import { SlideShell } from './SlideShell';

export function Slide08Closing({ index, total }: { index: number; total: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <SlideShell index={index} total={total} eyebrow="07 · CLOSING">
      <div
        className="bg-grid absolute inset-0 opacity-25"
        style={{
          maskImage: 'radial-gradient(ellipse at 30% 60%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 30% 60%, black 30%, transparent 75%)',
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-center" style={{ padding: '0 80px' }}>
        <div
          className="font-mono text-text-3 mb-6 transition-opacity duration-500"
          style={{
            fontSize: 13,
            letterSpacing: '0.12em',
            opacity: show ? 1 : 0,
          }}
        >
          ─── ONE LINE
        </div>
        <h1
          className="font-semibold transition-all duration-700"
          style={{
            fontSize: 84,
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            maxWidth: 1100,
            opacity: show ? 1 : 0,
            transform: show ? 'translateY(0)' : 'translateY(12px)',
          }}
        >
          이 점수가
          <br />
          <span className="text-acc">곧 이력서</span>가 됩니다.
        </h1>

        <div
          className="grid grid-cols-2 mt-16 transition-opacity duration-500"
          style={{
            gap: 48,
            maxWidth: 720,
            opacity: show ? 1 : 0,
            transitionDelay: '400ms',
          }}
        >
          {[
            ['BUILD', '12d × 2 devs', '영업일 2인 팀 sprint'],
            ['M1 TARGETS', '100 MAU · 50%', '완료율 (≥1 quest) · 30% 재방문'],
          ].map(([k, v, d]) => (
            <div key={k} className="flex flex-col">
              <span
                className="font-mono text-text-3"
                style={{ fontSize: 11, letterSpacing: '0.1em' }}
              >
                {k}
              </span>
              <span
                className="font-mono mt-2"
                style={{
                  fontSize: 22,
                  letterSpacing: '-0.01em',
                  color: 'var(--color-acc)',
                }}
              >
                {v}
              </span>
              <span className="text-text-3 mt-1.5" style={{ fontSize: 13 }}>
                {d}
              </span>
            </div>
          ))}
        </div>

        <div
          className="font-mono text-text-3 mt-20 transition-opacity duration-500"
          style={{
            fontSize: 12,
            letterSpacing: '0.08em',
            opacity: show ? 1 : 0,
            transitionDelay: '700ms',
          }}
        >
          THANK YOU · Q&A
        </div>
      </div>
    </SlideShell>
  );
}
