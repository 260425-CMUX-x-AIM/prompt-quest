'use client';

import { useEffect, useState } from 'react';
import { SlideShell } from './SlideShell';

const USER_PROMPT = '이메일 추출 정규식 만들어줘. 도메인에 dot 최소 1개, ReDoS 안전해야 해.';

// phases:
// 0 typing  1 sent  2 thinking  3 reply  4 validator  5 quant  6 judge  7 score
type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export function Slide04Demo({ index, total }: { index: number; total: number }) {
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<Phase>(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let i = 0;
    const typer = setInterval(() => {
      i++;
      setTyped(USER_PROMPT.slice(0, i));
      if (i >= USER_PROMPT.length) {
        clearInterval(typer);
        const schedule: [number, Phase][] = [
          [400, 1],
          [800, 2],
          [2100, 3],
          [3400, 4],
          [4200, 5],
          [5000, 6],
          [6200, 7],
        ];
        schedule.forEach(([ms, p]) => {
          timers.push(setTimeout(() => setPhase(p), ms));
        });
      }
    }, 32);

    return () => {
      clearInterval(typer);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <SlideShell index={index} total={total} eyebrow="03 · WALKTHROUGH">
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: '320px 1fr',
          padding: '40px 60px',
          gap: 40,
        }}
      >
        {/* Left rail — narration */}
        <div className="flex flex-col justify-center">
          <div
            className="font-mono text-text-3 mb-4"
            style={{ fontSize: 12, letterSpacing: '0.12em' }}
          >
            ─── 한 화면 흐름
          </div>
          <h2
            className="font-medium"
            style={{ fontSize: 38, lineHeight: 1.15, letterSpacing: '-0.02em' }}
          >
            프롬프트 한 줄에서
            <br />
            <span className="text-acc">점수까지.</span>
          </h2>
          <p className="text-text-2 mt-5" style={{ fontSize: 15, lineHeight: 1.55 }}>
            사용자 메시지 → AI 응답 → 4단계 채점까지 한 화면 흐름. 점수는 정량 28 + 정성 30 + 게이팅
            40으로 결정됩니다.
          </p>
          <div className="mt-7 flex flex-col gap-2">
            {[
              ['PROMPT', phase >= 1],
              ['AI RESPONSE', phase >= 3],
              ['EVALUATION', phase >= 4],
              ['SCORE', phase >= 7],
            ].map(([label, done]) => (
              <div key={label as string} className="flex items-center gap-2.5">
                <span
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: done ? 'var(--color-acc)' : 'var(--color-text-4)',
                    transition: 'color 300ms',
                    width: 14,
                  }}
                >
                  {done ? '●' : '○'}
                </span>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    color: done ? 'var(--color-text-2)' : 'var(--color-text-4)',
                    transition: 'color 300ms',
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — embedded session preview */}
        <div className="flex items-center justify-center">
          <div
            className="bg-bg-1 border border-line rounded-[12px] overflow-hidden w-full"
            style={{ maxWidth: 720 }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 border-b border-line bg-bg-2"
              style={{ padding: '11px 18px' }}
            >
              <div className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block w-[7px] h-[7px] rounded-full bg-acc"
                  style={{ boxShadow: '0 0 0 3px oklch(0.86 0.2 130 / 0.25)' }}
                />
                <span
                  className="font-mono text-text-3"
                  style={{ fontSize: 11, letterSpacing: '0.08em' }}
                >
                  SESSION PREVIEW
                </span>
              </div>
              <div className="bg-line-2" style={{ width: 1, height: 12 }} />
              <span className="font-mono text-text-2" style={{ fontSize: 12 }}>
                regex-email-001
              </span>
              <span
                className="ml-auto font-mono text-diff-easy"
                style={{
                  fontSize: 10.5,
                  padding: '2.5px 8px',
                  borderRadius: 3,
                  background: 'oklch(0.82 0.14 145 / 0.12)',
                  letterSpacing: '0.06em',
                }}
              >
                EASY
              </span>
            </div>

            {/* User */}
            <div className="flex gap-3" style={{ padding: '18px 20px' }}>
              <div
                className="bg-bg-3 text-text-2 grid place-items-center font-mono font-semibold flex-shrink-0"
                style={{ width: 26, height: 26, borderRadius: 5, fontSize: 11 }}
              >
                You
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="font-mono text-text-3 mb-1.5"
                  style={{ fontSize: 10.5, letterSpacing: '0.06em' }}
                >
                  PROMPT · {Math.max(1, Math.ceil(typed.length / 3.5))} TOK
                </div>
                <div className="text-text-1" style={{ fontSize: 14.5, lineHeight: 1.55 }}>
                  {typed}
                  {phase === 0 && <span className="caret" />}
                </div>
              </div>
            </div>

            {/* AI */}
            {phase >= 2 && (
              <div
                className="flex gap-3 bg-bg-1 border-t border-line animate-fade-in"
                style={{ padding: '18px 20px' }}
              >
                <div
                  className="bg-acc-dim text-acc grid place-items-center font-mono font-semibold flex-shrink-0"
                  style={{ width: 26, height: 26, borderRadius: 5, fontSize: 11 }}
                >
                  AI
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-mono text-text-3 mb-1.5"
                    style={{ fontSize: 10.5, letterSpacing: '0.06em' }}
                  >
                    AI AGENT · SOLVER{phase === 2 && ' · THINKING…'}
                  </div>
                  {phase === 2 ? (
                    <div className="flex gap-1" style={{ padding: '6px 0' }}>
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="bg-text-3 rounded-full"
                          style={{
                            width: 6,
                            height: 6,
                            animation: `bounce-dot 1.2s ${i * 0.15}s ease-in-out infinite`,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div
                        className="text-text-2 mb-2.5"
                        style={{ fontSize: 13.5, lineHeight: 1.55 }}
                      >
                        ReDoS 안전성을 위해 character class 중첩을 피한 패턴입니다:
                      </div>
                      <div
                        className="font-mono bg-bg-0 border border-line-2 text-acc overflow-x-auto whitespace-nowrap"
                        style={{ fontSize: 12.5, padding: '10px 12px', borderRadius: 5 }}
                      >
                        {String.raw`/\b[\w.+\-]+@[\w.-]+\.[A-Za-z]{2,}\b/g`}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Scoring */}
            {phase >= 4 && (
              <div
                className="border-t border-line bg-bg-0 animate-fade-in"
                style={{ padding: '14px 20px' }}
              >
                <div
                  className="font-mono text-text-3 mb-2.5"
                  style={{ fontSize: 10.5, letterSpacing: '0.08em' }}
                >
                  ─── EVALUATION
                </div>
                <div
                  className="grid items-center"
                  style={{ gridTemplateColumns: '1fr 1fr 1fr auto', gap: 14 }}
                >
                  <div className="font-mono text-text-2" style={{ fontSize: 12 }}>
                    <span className="text-acc">✓</span> Validator{' '}
                    <span className="text-text-3">3/3 · +40</span>
                  </div>
                  <div className="font-mono text-text-2" style={{ fontSize: 12 }}>
                    <span className={phase >= 5 ? 'text-acc' : 'text-text-4'}>
                      {phase >= 5 ? '✓' : '◌'}
                    </span>{' '}
                    Quant
                    {phase >= 5 && <span className="text-text-3"> −18% vs baseline · +27</span>}
                  </div>
                  <div className="font-mono text-text-2" style={{ fontSize: 12 }}>
                    <span className={phase >= 6 ? 'text-acc' : 'text-text-4'}>
                      {phase >= 6 ? '✓' : '◌'}
                    </span>{' '}
                    Judge ×3
                    {phase >= 6 && <span className="text-text-3"> σ=2.1 (&lt;5 신뢰) · +22</span>}
                  </div>
                  {phase >= 7 && (
                    <div className="flex items-baseline gap-1.5 animate-fade-in">
                      <span
                        className="font-mono font-semibold text-acc"
                        style={{ fontSize: 28, letterSpacing: '-0.02em' }}
                      >
                        87
                      </span>
                      <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
                        / 100
                      </span>
                    </div>
                  )}
                </div>
                {phase >= 7 && (
                  <div
                    className="font-mono text-text-3 mt-2 pt-2 border-t border-line animate-fade-in"
                    style={{ fontSize: 10.5, letterSpacing: '0.04em' }}
                  >
                    = 40 정확성 + 27 효율 + 22 협업 (Judge ×3 평균) − 2 패턴 · 난이도 ×1.0 (Easy)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
