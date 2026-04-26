'use client';

import { useEffect, useState } from 'react';
import { SlideShell } from './SlideShell';

const STEPS = [
  { tag: 'NOW', title: 'MVP — 11 카테고리 quest', sub: '풀이 → 채점 → 백분위 (라이브)' },
  { tag: 'Q3', title: '리더보드 + Elo', sub: '개발자 간 상대 비교 + 도전' },
  { tag: 'Q4', title: 'B2B 팀 워크스페이스', sub: '사내 quest, 채용 통합 파일럿' },
  {
    tag: 'NEXT',
    title: 'AI 활용 능력 표준',
    sub: 'PromptQuest Score = 이력서 한 줄',
    highlight: true,
  },
];

export function Slide07Vision({ index, total }: { index: number; total: number }) {
  const [reveal, setReveal] = useState(0);
  useEffect(() => {
    const timers = STEPS.map((_, i) => setTimeout(() => setReveal(i + 1), 250 + i * 350));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SlideShell index={index} total={total} eyebrow="06 · VISION">
      <div
        className="absolute inset-0 flex flex-col justify-center"
        style={{ padding: '60px 80px' }}
      >
        <div
          className="font-mono text-text-3 mb-4"
          style={{ fontSize: 12, letterSpacing: '0.12em' }}
        >
          ─── ROADMAP
        </div>
        <h2
          className="font-medium"
          style={{ fontSize: 46, lineHeight: 1.15, letterSpacing: '-0.02em' }}
        >
          AI 활용 능력의 <span className="text-acc">표준 점수</span>가 됩니다.
        </h2>
        <p className="text-text-2 mt-4" style={{ fontSize: 17, lineHeight: 1.55, maxWidth: 880 }}>
          quest 풀이가 누적되면 GitHub 커밋 그래프처럼 {'"AI 협업 이력"'}이 됩니다. 채용 시장과 교육
          시장 모두에서 검증 도구가 되는 것이 목표입니다.
        </p>

        <div className="grid grid-cols-4 mt-12 relative" style={{ gap: 16 }}>
          <div
            className="absolute top-9 left-0 right-0 border-t border-dashed border-line-2 pointer-events-none"
            style={{ zIndex: 0 }}
          />
          {STEPS.map((s, i) => {
            const visible = reveal > i;
            return (
              <div
                key={s.tag}
                className="relative flex flex-col items-start transition-all duration-500"
                style={{
                  zIndex: 1,
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(8px)',
                }}
              >
                <div
                  className="rounded-full grid place-items-center font-mono font-semibold mb-4"
                  style={{
                    width: 36,
                    height: 36,
                    background: s.highlight ? 'var(--color-acc)' : 'var(--color-bg-2)',
                    color: s.highlight ? 'var(--color-acc-ink)' : 'var(--color-text-2)',
                    border: s.highlight
                      ? '1px solid var(--color-acc)'
                      : '1px solid var(--color-line-2)',
                    fontSize: 11,
                    letterSpacing: '0.04em',
                  }}
                >
                  {s.tag}
                </div>
                <div
                  className="font-medium"
                  style={{
                    fontSize: 17,
                    color: s.highlight ? 'var(--color-acc)' : 'var(--color-text-1)',
                    lineHeight: 1.3,
                  }}
                >
                  {s.title}
                </div>
                <div className="text-text-3 mt-1.5" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                  {s.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SlideShell>
  );
}
