'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { CategoryTag, DiffTag } from '@/components/Tags';
import StatChip from '@/components/StatChip';
import ProgressBar from '@/components/ProgressBar';
import { ALL_TASKS } from '@/lib/data';
import { useEvaluationResult } from '@/lib/evaluation/storage';
import type { EvaluationResult } from '@/lib/evaluation/types';

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export default function ResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const result: EvaluationResult | null = useEvaluationResult(slug);

  const task = useMemo(() => ALL_TASKS.find((item) => item.slug === slug) || ALL_TASKS[0], [slug]);
  const recommendedTask = useMemo(
    () => ALL_TASKS.find((item) => item.slug !== slug && !item.locked) || ALL_TASKS[0],
    [slug],
  );

  if (!result) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-bg-0 text-text-1">
        <NavBar />
        <div className="flex-1 flex items-center justify-center" style={{ padding: 32 }}>
          <div className="w-full max-w-[520px] bg-bg-1 border border-line rounded-[12px] p-6 text-center">
            <div
              className="font-mono text-text-3 mb-2"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              RESULT NOT FOUND
            </div>
            <h1 className="font-medium mb-2" style={{ fontSize: 24 }}>
              표시할 채점 결과가 없습니다
            </h1>
            <p className="text-text-2 mb-5" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              로그인 없는 데모 모드에서는 현재 탭의 임시 저장소에서만 결과를 읽습니다. 챌린지
              화면에서 다시 제출해 주세요.
            </p>
            <div className="flex gap-2">
              <Link
                href={`/challenge/${slug}`}
                className="flex-1 flex items-center justify-center bg-acc text-acc-ink font-medium rounded-md border border-acc"
                style={{ padding: '8px 12px', fontSize: 12.5 }}
              >
                챌린지로 돌아가기
              </Link>
              <Link
                href="/tasks"
                className="flex-1 flex items-center justify-center rounded-md border border-line text-text-1 hover:bg-bg-2"
                style={{ padding: '8px 12px', fontSize: 12.5 }}
              >
                태스크 목록 보기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-0 text-text-1">
      <NavBar />
      <div className="flex-1 overflow-y-auto custom-scroll">
        <div className="max-w-[980px] mx-auto" style={{ padding: '32px 36px' }}>
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
                  {result.totalScore}
                </span>
                <span className="font-mono text-text-3" style={{ fontSize: 18, marginBottom: 14 }}>
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
                  {result.validatorPassed ? 'PASS' : 'FAIL'}
                </span>
                <span
                  className="inline-flex items-center font-mono text-text-2 bg-bg-1 border border-line-2 rounded"
                  style={{ fontSize: 11, padding: '2px 7px' }}
                >
                  {result.meta.evaluator} · {result.meta.validatorModel}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <CategoryTag cat={result.challenge.category} />
                <DiffTag level={result.challenge.difficulty} />
                <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
                  {result.challenge.slug}
                </span>
              </div>
              <h1 className="font-medium mb-3.5" style={{ fontSize: 26 }}>
                {result.challenge.title}
              </h1>
              <div className="grid grid-cols-4 gap-2">
                <StatChip label="시도" value={`${result.summary.attemptCount}회`} accent />
                <StatChip label="시간" value={formatElapsed(result.summary.elapsedSeconds)} />
                <StatChip label="토큰" value={result.summary.totalTokens.toLocaleString()} />
                <StatChip label="메시지" value={`${result.summary.messageCount}`} />
              </div>
            </div>
          </div>

          <div className="grid gap-7" style={{ gridTemplateColumns: '1fr 320px' }}>
            <div>
              <div
                className="font-mono text-text-3 mb-3.5"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                ─── BREAKDOWN
              </div>
              <div className="bg-bg-1 border border-line rounded-[10px] overflow-hidden">
                {result.metricReasons.map((metric, index) => {
                  const pct = metric.max > 0 ? (metric.score / metric.max) * 100 : 0;
                  const color =
                    pct > 80
                      ? 'var(--color-acc)'
                      : pct > 50
                        ? 'var(--color-warn)'
                        : 'var(--color-err)';

                  return (
                    <div
                      key={metric.label}
                      style={{
                        padding: '16px 18px',
                        borderBottom:
                          index < result.metricReasons.length - 1
                            ? '1px solid var(--color-line)'
                            : 'none',
                      }}
                    >
                      <div className="flex justify-between items-baseline mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-text-3" style={{ fontSize: 10 }}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="font-medium" style={{ fontSize: 14 }}>
                            {metric.label}
                          </span>
                        </div>
                        <div className="font-mono" style={{ fontSize: 13 }}>
                          <span className="font-semibold" style={{ color }}>
                            {metric.score}
                          </span>
                          <span className="text-text-4"> / {metric.max}</span>
                        </div>
                      </div>
                      <ProgressBar value={pct} color={color} height={4} />
                      <div className="text-text-3 mt-2" style={{ fontSize: 12, lineHeight: 1.5 }}>
                        {metric.reason}
                      </div>
                    </div>
                  );
                })}
              </div>

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
                  <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{result.feedback.good}</p>
                </div>
                <div className="bg-bg-1 border border-line rounded-[10px] p-4.5">
                  <div
                    className="font-mono mb-2.5"
                    style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--color-warn)' }}
                  >
                    ◆ 개선할 점
                  </div>
                  <p className="text-text-2" style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                    {result.feedback.improve}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div
                className="font-mono text-text-3 mb-3.5"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                ─── SUMMARY
              </div>
              <div className="bg-bg-1 border border-line rounded-[10px] p-4 mb-4.5">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-text-3" style={{ fontSize: 11.5 }}>
                      task
                    </span>
                    <span className="font-mono" style={{ fontSize: 11.5 }}>
                      {task.title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-3" style={{ fontSize: 11.5 }}>
                      score
                    </span>
                    <span className="font-mono text-acc" style={{ fontSize: 11.5 }}>
                      {result.totalScore}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-3" style={{ fontSize: 11.5 }}>
                      validator
                    </span>
                    <span className="font-mono" style={{ fontSize: 11.5 }}>
                      {result.validatorPassed ? 'pass' : 'fail'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-3" style={{ fontSize: 11.5 }}>
                      judge model
                    </span>
                    <span className="font-mono" style={{ fontSize: 11.5 }}>
                      {result.meta.judgeModel}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="font-mono text-text-3 mb-3.5"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                ─── RECOMMENDED
              </div>
              <div className="bg-bg-1 border border-line rounded-[10px] p-3.5">
                <div className="font-mono text-text-4 mb-2" style={{ fontSize: 10 }}>
                  NEXT
                </div>
                <div className="font-medium mb-1" style={{ fontSize: 13.5 }}>
                  {recommendedTask.title}
                </div>
                <div className="flex gap-1.5 mb-3">
                  <CategoryTag cat={recommendedTask.cat} />
                  <DiffTag level={recommendedTask.diff} />
                </div>
                <Link
                  href={`/challenge/${recommendedTask.slug}`}
                  className="w-full flex items-center justify-center bg-acc text-acc-ink font-medium rounded-md border border-acc cursor-pointer"
                  style={{ padding: '5px 10px', fontSize: 12 }}
                >
                  계속하기 →
                </Link>
              </div>

              <div className="flex gap-1.5 mt-3.5">
                <Link
                  href={`/challenge/${slug}`}
                  className="flex-1 flex items-center justify-center rounded border border-line text-text-1 bg-transparent hover:bg-bg-2 cursor-pointer"
                  style={{ fontSize: 12, padding: '5px 10px' }}
                >
                  ↻ 재도전
                </Link>
                <Link
                  href="/tasks"
                  className="flex-1 flex items-center justify-center rounded border border-line text-text-1 bg-transparent hover:bg-bg-2 cursor-pointer"
                  style={{ fontSize: 12, padding: '5px 10px' }}
                >
                  목록 보기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
