'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';

export default function LandingPage() {
  const userPrompt = '이메일 추출 정규식 만들어줘. 도메인에 dot 최소 1개, ReDoS 안전해야 해.';
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState(0); // 0:typing 1:user-sent 2:ai-thinking 3:ai-reply 4:scoring 5:done

  useEffect(() => {
    let i = 0;
    const typer = setInterval(() => {
      i++;
      setTyped(userPrompt.slice(0, i));
      if (i >= userPrompt.length) {
        clearInterval(typer);
        setTimeout(() => setPhase(1), 400);
        setTimeout(() => setPhase(2), 700);
        setTimeout(() => setPhase(3), 1700);
        setTimeout(() => setPhase(4), 2900);
        setTimeout(() => setPhase(5), 4100);
      }
    }, 35);
    return () => clearInterval(typer);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-0 text-text-1">
      <NavBar />
      <div className="flex-1 overflow-y-auto custom-scroll">
        {/* Hero */}
        <div
          className="relative overflow-hidden border-b border-line"
          style={{ padding: '80px 60px 60px' }}
        >
          <div
            className="bg-grid absolute inset-0 opacity-25"
            style={{
              maskImage: 'radial-gradient(ellipse at 70% 40%, black 30%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse at 70% 40%, black 30%, transparent 75%)',
            }}
          />
          <div className="relative max-w-[1100px] mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <span
                className="inline-block w-[7px] h-[7px] rounded-full bg-acc"
                style={{ boxShadow: '0 0 0 3px oklch(0.86 0.2 130 / 0.25)' }}
              />
              <span
                className="font-mono text-text-3"
                style={{ fontSize: 11, letterSpacing: '0.04em' }}
              >
                BETA · 178 devs training this week
              </span>
            </div>
            <h1
              className="font-semibold mb-5"
              style={{
                fontSize: 64,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                maxWidth: 820,
              }}
            >
              AI를 잘 쓰는 개발자가
              <br />
              <span className="text-acc">점수로 증명</span>되는 곳.
            </h1>
            <p
              className="text-text-2 mb-9"
              style={{ fontSize: 17, lineHeight: 1.55, maxWidth: 560 }}
            >
              실제 업무 시나리오 기반 태스크를 Claude·GPT와 함께 풀고, 4단계 채점 파이프라인이
              당신의 AI 활용 능력을 정량화합니다.
            </p>
            <div className="flex gap-2.5" style={{ marginBottom: 60 }}>
              <Link
                href="/tasks"
                className="inline-flex items-center gap-2 bg-acc text-acc-ink font-semibold rounded-md border border-acc cursor-pointer transition-[filter] hover:brightness-105"
                style={{ fontSize: 13, padding: '8px 14px' }}
              >
                무료로 시작하기
                <span
                  className="font-mono rounded"
                  style={{
                    fontSize: 10.5,
                    padding: '1px 5px',
                    background: 'rgba(0,0,0,0.15)',
                    border: '1px solid rgba(0,0,0,0.2)',
                    color: 'rgba(0,0,0,0.6)',
                  }}
                >
                  ↵
                </span>
              </Link>
              <Link
                href="/tasks"
                className="inline-flex items-center gap-2 bg-transparent text-text-1 rounded-md border border-line cursor-pointer hover:bg-bg-2"
                style={{ fontSize: 13, padding: '8px 14px', fontWeight: 500 }}
              >
                데모 태스크 보기 →
              </Link>
            </div>

            {/* Inline chat demo — prompt → AI reply → live scoring */}
            <div
              className="bg-bg-1 border border-line rounded-[10px] overflow-hidden"
              style={{ maxWidth: 720 }}
            >
              {/* Session header */}
              <div
                className="flex items-center gap-2.5 border-b border-line bg-bg-2"
                style={{ padding: '9px 14px' }}
              >
                <div className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block w-[7px] h-[7px] rounded-full bg-acc"
                    style={{ boxShadow: '0 0 0 3px oklch(0.86 0.2 130 / 0.25)' }}
                  />
                  <span
                    className="font-mono text-text-3"
                    style={{ fontSize: 10.5, letterSpacing: '0.04em' }}
                  >
                    LIVE SESSION
                  </span>
                </div>
                <div className="bg-line-2" style={{ width: 1, height: 12 }} />
                <span className="font-mono text-text-2" style={{ fontSize: 11 }}>
                  regex-email-001
                </span>
                <span
                  className="ml-auto font-mono text-diff-easy"
                  style={{
                    fontSize: 10,
                    padding: '2px 7px',
                    borderRadius: 3,
                    background: 'oklch(0.82 0.14 145 / 0.12)',
                    letterSpacing: '0.06em',
                  }}
                >
                  EASY
                </span>
              </div>

              {/* User message */}
              <div className="flex gap-2.5" style={{ padding: '14px 16px' }}>
                <div
                  className="bg-bg-3 text-text-2 grid place-items-center font-mono font-semibold flex-shrink-0"
                  style={{ width: 22, height: 22, borderRadius: 4, fontSize: 10 }}
                >
                  You
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-mono text-text-3 mb-1"
                    style={{ fontSize: 9.5, letterSpacing: '0.04em' }}
                  >
                    PROMPT · {Math.max(1, Math.ceil(typed.length / 3.5))} tok
                  </div>
                  <div className="text-text-1" style={{ fontSize: 13, lineHeight: 1.55 }}>
                    {typed}
                    {phase === 0 && <span className="caret" />}
                  </div>
                </div>
              </div>

              {/* AI message */}
              {phase >= 2 && (
                <div
                  className="flex gap-2.5 bg-bg-1 border-t border-line"
                  style={{ padding: '14px 16px' }}
                >
                  <div
                    className="bg-acc-dim text-acc grid place-items-center font-mono font-semibold flex-shrink-0"
                    style={{ width: 22, height: 22, borderRadius: 4, fontSize: 10 }}
                  >
                    AI
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-mono text-text-3 mb-1"
                      style={{ fontSize: 9.5, letterSpacing: '0.04em' }}
                    >
                      claude-sonnet-4-5{phase === 2 && ' · thinking…'}
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
                          className="text-text-2 mb-2"
                          style={{ fontSize: 12.5, lineHeight: 1.55 }}
                        >
                          ReDoS 안전성을 위해 character class 중첩을 피한 패턴입니다:
                        </div>
                        <div
                          className="font-mono bg-bg-0 border border-line-2 text-acc overflow-x-auto whitespace-nowrap"
                          style={{ fontSize: 11.5, padding: '8px 10px', borderRadius: 4 }}
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
                  style={{ padding: '12px 16px' }}
                >
                  <div
                    className="font-mono text-text-3 mb-2"
                    style={{ fontSize: 9.5, letterSpacing: '0.06em' }}
                  >
                    ─── EVALUATION
                  </div>
                  <div
                    className="grid items-center"
                    style={{ gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12 }}
                  >
                    <div className="font-mono text-text-2" style={{ fontSize: 11 }}>
                      <span className="text-acc">✓</span> Validator{' '}
                      <span className="text-text-3">3/3</span>
                    </div>
                    <div className="font-mono text-text-2" style={{ fontSize: 11 }}>
                      <span className="text-acc">✓</span> Quant{' '}
                      <span className="text-text-3">−18%tok</span>
                    </div>
                    <div className="font-mono text-text-2" style={{ fontSize: 11 }}>
                      <span className={phase >= 5 ? 'text-acc' : 'text-warn'}>
                        {phase >= 5 ? '✓' : '◌'}
                      </span>{' '}
                      Judge ×3
                      {phase >= 5 && (
                        <>
                          {' '}
                          <span className="text-text-3">σ=2.1</span>
                        </>
                      )}
                    </div>
                    {phase >= 5 && (
                      <div className="flex items-baseline gap-1 animate-fade-in">
                        <span
                          className="font-mono font-semibold text-acc"
                          style={{ fontSize: 22, letterSpacing: '-0.02em' }}
                        >
                          87
                        </span>
                        <span className="font-mono text-text-3" style={{ fontSize: 10 }}>
                          · top 12%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="border-b border-line" style={{ padding: 60 }}>
          <div className="max-w-[1100px] mx-auto">
            <div
              className="font-mono text-text-3 mb-2"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              ─── HOW IT WORKS
            </div>
            <h2 className="font-medium mb-9" style={{ fontSize: 28 }}>
              4-stage evaluation pipeline.
            </h2>
            <div className="grid grid-cols-4 gap-4">
              {[
                {
                  n: '01',
                  t: 'Validator',
                  d: '결과물이 요구사항을 충족하는지 PASS/FAIL 판정',
                },
                {
                  n: '02',
                  t: 'Quantitative',
                  d: '토큰·시도·시간을 베이스라인 대비 분석',
                },
                {
                  n: '03',
                  t: 'Judge x3',
                  d: '명확성·컨텍스트·복구 정성 채점 (앙상블)',
                },
                {
                  n: '04',
                  t: 'Aggregator',
                  d: '난이도 보정 + 백분위 + 피드백 생성',
                },
              ].map((s) => (
                <div key={s.n} className="bg-bg-1 border border-line rounded-[10px] p-5">
                  <div className="font-mono text-text-3 mb-2.5" style={{ fontSize: 10 }}>
                    STAGE {s.n}
                  </div>
                  <div className="font-medium mb-1.5" style={{ fontSize: 16 }}>
                    {s.t}
                  </div>
                  <div className="text-text-2" style={{ fontSize: 12.5, lineHeight: 1.55 }}>
                    {s.d}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="border-b border-line" style={{ padding: 60 }}>
          <div className="max-w-[1100px] mx-auto">
            <div
              className="font-mono text-text-3 mb-2"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              ─── 11 CATEGORIES
            </div>
            <h2 className="font-medium mb-7" style={{ fontSize: 28 }}>
              실전 시나리오 기반 트레이닝.
            </h2>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  ['regex', 'easy', 12],
                  ['debug', 'easy', 8],
                  ['review', 'easy', 6],
                  ['component', 'medium', 14],
                  ['algo', 'medium', 11],
                  ['api_design', 'medium', 9],
                  ['test', 'medium', 7],
                  ['arch', 'hard', 5],
                  ['refactor', 'hard', 8],
                  ['security', 'hard', 4],
                  ['perf', 'hard', 6],
                ] as [string, string, number][]
              ).map(([c, d, n]) => (
                <div
                  key={c}
                  className="flex justify-between items-center bg-bg-1 border border-line rounded-md"
                  style={{ padding: '12px 14px' }}
                >
                  <div>
                    <div className="font-mono" style={{ fontSize: 13 }}>
                      {c}
                    </div>
                    <div
                      className="font-mono text-text-3 uppercase mt-0.5"
                      style={{ fontSize: 10 }}
                    >
                      {d}
                    </div>
                  </div>
                  <div className="font-mono text-text-3" style={{ fontSize: 11 }}>
                    {n} tasks
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center" style={{ padding: '40px 60px' }}>
          <div className="font-mono text-text-3" style={{ fontSize: 11 }}>
            © 2026 promptquest · v0.1.0-beta
          </div>
          <div className="flex gap-4.5">
            <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
              github
            </span>
            <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
              docs
            </span>
            <Link
              href="/pricing"
              className="font-mono text-text-3 hover:text-text-2"
              style={{ fontSize: 11 }}
            >
              pricing
            </Link>
            <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
              discord
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
