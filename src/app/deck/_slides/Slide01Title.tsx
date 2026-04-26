'use client';

import { useEffect, useState } from 'react';
import { SlideShell } from './SlideShell';

export function Slide01Title({ index, total }: { index: number; total: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <SlideShell index={index} total={total} eyebrow="00 · INTRO">
      <div
        className="bg-grid absolute inset-0 opacity-25"
        style={{
          maskImage: 'radial-gradient(ellipse at 70% 40%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 70% 40%, black 30%, transparent 75%)',
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-center" style={{ padding: '0 80px' }}>
        <div
          className="font-mono text-text-3 mb-6 transition-opacity duration-700"
          style={{
            fontSize: 13,
            letterSpacing: '0.12em',
            opacity: show ? 1 : 0,
          }}
        >
          ─── PROMPTQUEST
        </div>
        <h1
          className="font-semibold transition-all duration-700"
          style={{
            fontSize: 88,
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            maxWidth: 1100,
            opacity: show ? 1 : 0,
            transform: show ? 'translateY(0)' : 'translateY(12px)',
          }}
        >
          AI를 잘 쓰는 개발자가
          <br />
          <span className="text-acc">점수로 증명</span>되는 곳.
        </h1>
        <p
          className="text-text-2 transition-all duration-700"
          style={{
            fontSize: 22,
            lineHeight: 1.5,
            maxWidth: 760,
            marginTop: 36,
            opacity: show ? 1 : 0,
            transform: show ? 'translateY(0)' : 'translateY(12px)',
            transitionDelay: '120ms',
          }}
        >
          실제 업무 시나리오 태스크를 AI와 함께 풀고, 4단계 채점 파이프라인이 당신의 AI 활용 능력을
          정량화합니다.
        </p>
        <div
          className="flex items-center gap-3 transition-opacity duration-700"
          style={{ marginTop: 48, opacity: show ? 1 : 0, transitionDelay: '300ms' }}
        >
          <span className="font-mono text-text-3" style={{ fontSize: 12, letterSpacing: '0.1em' }}>
            EARLY BUILD · 12-DAY HACKATHON SPRINT
          </span>
        </div>
      </div>
    </SlideShell>
  );
}
