'use client';

import { use } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { CategoryTag, DiffTag } from '@/components/Tags';
import StatChip from '@/components/StatChip';
import ProgressBar from '@/components/ProgressBar';

export default function ResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  use(params);
  const score = 87;
  const breakdown = [
    {
      k: 'correctness',
      label: '정확성',
      score: 40,
      max: 40,
      reason: 'Validator PASS · 모든 요구사항 충족',
    },
    {
      k: 'efficiency',
      label: '효율성',
      score: 32,
      max: 40,
      reason: '토큰 ↓ 18% · 시도 1회 · 시간 +20%',
    },
    {
      k: 'context',
      label: '컨텍스트 활용',
      score: 16.6,
      max: 20,
      reason: '이전 응답 정확히 참조 8.3/10',
    },
    {
      k: 'recovery',
      label: '에러 복구',
      score: 9,
      max: 10,
      reason: 'edge case 발견 후 명확한 수정',
    },
    {
      k: 'clarity',
      label: '프롬프트 명확성',
      score: 9,
      max: 10,
      reason: '첫 프롬프트에 요구사항·제약 명시',
    },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-0 text-text-1">
      <NavBar />
      <div className="flex-1 overflow-y-auto custom-scroll">
        <div className="max-w-[980px] mx-auto" style={{ padding: '32px 36px' }}>
          {/* Hero */}
          <div
            className="grid gap-8 border-b border-line mb-7"
            style={{
              gridTemplateColumns: '260px 1fr',
              padding: '28px 0 32px',
            }}
          >
            <div>
              <div
                className="font-mono text-text-3 mb-1.5"
                style={{ fontSize: 10, letterSpacing: '0.08em' }}
              >
                FINAL SCORE
              </div>
              <div className="flex items-end gap-1.5">
                <span
                  className="font-mono font-semibold text-acc"
                  style={{ fontSize: 88, lineHeight: 0.9, letterSpacing: '-0.04em' }}
                >
                  {score}
                </span>
                <span
                  className="font-mono text-text-3"
                  style={{ fontSize: 18, marginBottom: 14 }}
                >
                  /100
                </span>
              </div>
              <div className="flex gap-1.5 mt-3">
                <span
                  className="inline-flex items-center font-mono uppercase text-acc border rounded"
                  style={{
                    fontSize: 11,
                    padding: '2px 7px',
                    borderColor: 'var(--color-acc-line)',
                    background: 'var(--color-acc-dim)',
                  }}
                >
                  ▲ TOP 12%
                </span>
                <span
                  className="inline-flex items-center font-mono text-text-2 bg-bg-1 border border-line-2 rounded"
                  style={{ fontSize: 11, padding: '2px 7px' }}
                >
                  +2 personal best
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <CategoryTag cat="regex" />
                <DiffTag level="easy" />
                <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
                  regex-email-001
                </span>
              </div>
              <h1 className="font-medium mb-3.5" style={{ fontSize: 26 }}>
                이메일 추출 정규식 작성
              </h1>
              <div className="grid grid-cols-4 gap-2">
                <StatChip label="시도" value="1회" accent />
                <StatChip label="시간" value="07:42" />
                <StatChip label="토큰" value="1,234" />
                <StatChip label="메시지" value="4" />
              </div>
            </div>
          </div>

          {/* Breakdown + aside */}
          <div className="grid gap-7" style={{ gridTemplateColumns: '1fr 320px' }}>
            <div>
              <div
                className="font-mono text-text-3 mb-3.5"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                ─── BREAKDOWN
              </div>
              <div className="bg-bg-1 border border-line rounded-[10px] overflow-hidden">
                {breakdown.map((b, i) => {
                  const pct = (b.score / b.max) * 100;
                  return (
                    <div
                      key={b.k}
                      style={{
                        padding: '16px 18px',
                        borderBottom:
                          i < breakdown.length - 1 ? '1px solid var(--color-line)' : 'none',
                      }}
                    >
                      <div className="flex justify-between items-baseline mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-text-3" style={{ fontSize: 10 }}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="font-medium" style={{ fontSize: 14 }}>
                            {b.label}
                          </span>
                          <span className="font-mono text-text-4" style={{ fontSize: 10 }}>
                            {b.k}
                          </span>
                        </div>
                        <div className="font-mono" style={{ fontSize: 13 }}>
                          <span
                            className="font-semibold"
                            style={{
                              color:
                                pct > 80
                                  ? 'var(--color-acc)'
                                  : pct > 50
                                    ? 'var(--color-warn)'
                                    : 'var(--color-err)',
                            }}
                          >
                            {b.score}
                          </span>
                          <span className="text-text-4"> / {b.max}</span>
                        </div>
                      </div>
                      <ProgressBar
                        value={pct}
                        color={
                          pct > 80
                            ? 'var(--color-acc)'
                            : pct > 50
                              ? 'var(--color-warn)'
                              : 'var(--color-err)'
                        }
                        height={4}
                      />
                      <div
                        className="text-text-3 mt-2"
                        style={{ fontSize: 12, lineHeight: 1.5 }}
                      >
                        {b.reason}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Feedback */}
              <div
                className="font-mono text-text-3 mt-7 mb-3.5"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                ─── FEEDBACK
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div
                  className="bg-bg-1 border rounded-[10px] p-4.5"
                  style={{ borderColor: 'var(--color-acc-line)' }}
                >
                  <div
                    className="font-mono text-acc mb-2.5"
                    style={{ fontSize: 10, letterSpacing: '0.06em' }}
                  >
                    ◆ 잘한 점
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                    첫 프롬프트에 요구사항·제약·출력 형식을 모두 포함했습니다. edge case를 발견하고
                    이전 패턴을 명시적으로 참조하며 개선 방향을 제시한 것이 인상적입니다.
                  </p>
                </div>
                <div className="bg-bg-1 border border-line rounded-[10px] p-4.5">
                  <div
                    className="font-mono mb-2.5"
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.06em',
                      color: 'var(--color-warn)',
                    }}
                  >
                    ◆ 개선할 점
                  </div>
                  <p className="text-text-2" style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                    초기 프롬프트에 edge case 예시(
                    <span className="font-mono text-text-1" style={{ fontSize: 11 }}>
                      a@b.c
                    </span>
                    )를 함께 제시했다면 1턴에 종료할 수 있었습니다. 시간 효율 점수가 낮은 이유입니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Aside */}
            <div>
              <div
                className="font-mono text-text-3 mb-3.5"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                ─── DISTRIBUTION
              </div>
              <div className="bg-bg-1 border border-line rounded-[10px] p-4 mb-4.5">
                <div className="flex items-end gap-0.5 mb-2" style={{ height: 80 }}>
                  {[3, 5, 8, 12, 18, 24, 28, 22, 15, 8].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-[1px]"
                      style={{
                        height: `${(h / 28) * 100}%`,
                        background: i === 8 ? 'var(--color-acc)' : 'var(--color-bg-3)',
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-text-3" style={{ fontSize: 10 }}>
                    0
                  </span>
                  <span className="font-mono text-acc" style={{ fontSize: 10 }}>
                    you · 87
                  </span>
                  <span className="font-mono text-text-3" style={{ fontSize: 10 }}>
                    100
                  </span>
                </div>
                <div className="h-px bg-line my-3" />
                <div className="flex flex-col gap-1.5">
                  {[
                    ['median', '64', ''],
                    ['top 10%', '89', ''],
                    ['your percentile', '88.4', 'var(--color-acc)'],
                  ].map(([l, v, c]) => (
                    <div key={l} className="flex justify-between">
                      <span className="text-text-3" style={{ fontSize: 11.5 }}>
                        {l}
                      </span>
                      <span
                        className="font-mono"
                        style={{ fontSize: 11.5, color: c || 'var(--color-text-1)' }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="font-mono text-text-3 mb-3.5"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                ─── RECOMMENDED
              </div>
              <div className="bg-bg-1 border border-line rounded-[10px] p-3.5">
                <div
                  className="font-mono text-text-4 mb-2"
                  style={{ fontSize: 10 }}
                >
                  NEXT
                </div>
                <div className="font-medium mb-1" style={{ fontSize: 13.5 }}>
                  객체 배열 다중 키 정렬
                </div>
                <div className="flex gap-1.5 mb-3">
                  <CategoryTag cat="algo" />
                  <DiffTag level="medium" />
                </div>
                <Link
                  href="/tasks/algo-sort-001"
                  className="w-full flex items-center justify-center bg-acc text-acc-ink font-medium rounded-md border border-acc cursor-pointer"
                  style={{ padding: '5px 10px', fontSize: 12 }}
                >
                  계속하기 →
                </Link>
              </div>

              <div className="flex gap-1.5 mt-3.5">
                <Link
                  href="/tasks"
                  className="flex-1 flex items-center justify-center rounded border border-line text-text-1 bg-transparent hover:bg-bg-2 cursor-pointer"
                  style={{ fontSize: 12, padding: '5px 10px' }}
                >
                  ↻ 재도전
                </Link>
                <button
                  className="flex-1 flex items-center justify-center rounded border border-line text-text-1 bg-transparent hover:bg-bg-2 cursor-pointer"
                  style={{ fontSize: 12, padding: '5px 10px' }}
                >
                  ↗ 공유
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
