'use client';

import { use } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { CategoryTag, DiffTag } from '@/components/Tags';
import { ALL_TASKS } from '@/lib/data';

export default function TaskDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const t = ALL_TASKS.find((x) => x.slug === slug) || ALL_TASKS[0];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-0 text-text-1">
      <NavBar />
      <div className="flex-1 overflow-y-auto custom-scroll">
        <div className="max-w-[920px] mx-auto" style={{ padding: '32px 36px' }}>
          <Link
            href="/tasks"
            className="font-mono text-text-3 hover:text-text-2 mb-5 inline-block"
            style={{ fontSize: 11 }}
          >
            ← tasks
          </Link>

          <div className="flex gap-2 mb-3.5">
            <CategoryTag cat={t.cat} />
            <DiffTag level={t.diff} />
            <span
              className="inline-flex items-center font-mono text-text-2 bg-bg-1 border border-line-2 rounded"
              style={{ fontSize: 11, padding: '2px 7px' }}
            >
              ~{t.mins}min
            </span>
          </div>

          <h1 className="font-medium mb-1.5" style={{ fontSize: 30, letterSpacing: '-0.01em' }}>
            {t.title}
          </h1>
          <div className="font-mono text-text-3 mb-7" style={{ fontSize: 12 }}>
            {t.slug} · v1
          </div>

          <div className="grid gap-7" style={{ gridTemplateColumns: '1fr 280px' }}>
            <div>
              <div
                className="font-mono text-text-3 mb-2"
                style={{ fontSize: 10, letterSpacing: '0.08em' }}
              >
                SCENARIO
              </div>
              <p className="text-text-2 mb-6" style={{ fontSize: 14, lineHeight: 1.65 }}>
                당신은 로그 파일을 파싱하는 스크립트를 작성 중입니다. 여러 형식이 섞여있는 텍스트에서
                이메일 주소만 정확히 추출해야 합니다. AI에게 정규식 패턴을 만들어달라고 요청하세요.
              </p>

              <div
                className="font-mono text-text-3 mb-2.5"
                style={{ fontSize: 10, letterSpacing: '0.08em' }}
              >
                REQUIREMENTS
              </div>
              <div className="flex flex-col gap-2 mb-6">
                {[
                  ['req-1', '유효한 이메일 형식만 매칭', 0.5],
                  ['req-2', '도메인 부분에 점이 최소 1개 포함', 0.3],
                  [
                    'req-3',
                    'ReDoS 공격에 안전한 패턴 (catastrophic backtracking 없음)',
                    0.2,
                  ],
                ].map(([id, desc, w]) => (
                  <div
                    key={id as string}
                    className="flex items-start gap-3 bg-bg-1 border border-line rounded-md"
                    style={{ padding: '10px 12px' }}
                  >
                    <div className="font-mono text-acc mt-0.5" style={{ fontSize: 10.5 }}>
                      {id as string}
                    </div>
                    <div className="flex-1" style={{ fontSize: 13 }}>
                      {desc as string}
                    </div>
                    <div className="font-mono text-text-3" style={{ fontSize: 10 }}>
                      w={w}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="font-mono text-text-3 mb-2.5"
                style={{ fontSize: 10, letterSpacing: '0.08em' }}
              >
                OUTPUT FORMAT
              </div>
              <div
                className="font-mono bg-[#0a0c0f] border border-line rounded-md mb-6 overflow-x-auto whitespace-pre"
                style={{ fontSize: 12.5, lineHeight: 1.6, padding: '12px 14px' }}
              >
                <span className="text-text-3 italic">{'// JavaScript regex literal'}</span>
                {'\n'}
                <span style={{ color: 'oklch(0.78 0.12 280)' }}>const</span>{' '}
                <span style={{ color: 'oklch(0.85 0.10 200)' }}>EMAIL_REGEX</span> = /
                <span className="text-acc">YOUR_PATTERN</span>/
                <span style={{ color: 'oklch(0.84 0.14 80)' }}>g</span>;
              </div>

              <div
                className="font-mono text-text-3 mb-2.5"
                style={{ fontSize: 10, letterSpacing: '0.08em' }}
              >
                TEST CASES <span className="text-text-4">(3)</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {[
                  [
                    'positive',
                    '"Contact: alice@example.com or bob@sub.test.org"',
                    '["alice@…", "bob@…"]',
                  ],
                  ['negative', '"Invalid: not-an-email, @missing.com"', '[]'],
                  [
                    'edge_case',
                    '"Edge: a@b.c, very.long+tag@co.uk"',
                    '["a@b.c", "very.long…"]',
                  ],
                ].map(([type, inp, out], i) => (
                  <div
                    key={i}
                    className="bg-bg-1 border border-line rounded-md"
                    style={{ padding: '8px 12px' }}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-mono text-text-3" style={{ fontSize: 10 }}>
                        tc-{i + 1}
                      </span>
                      <span
                        className={`inline-flex items-center font-mono uppercase bg-bg-1 rounded ${
                          type === 'positive'
                            ? 'text-diff-easy border-diff-easy/35'
                            : type === 'negative'
                              ? 'text-diff-hard border-diff-hard/35'
                              : 'text-text-2 border-line-2'
                        }`}
                        style={{
                          fontSize: 11,
                          padding: '2px 7px',
                          border: '1px solid',
                        }}
                      >
                        {type}
                      </span>
                    </div>
                    <div className="font-mono text-text-2" style={{ fontSize: 11 }}>
                      {inp}
                    </div>
                    <div className="font-mono text-text-3 mt-0.5" style={{ fontSize: 11 }}>
                      → {out}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aside */}
            <div className="sticky top-5">
              <div className="bg-bg-1 border border-line rounded-[10px] p-4.5 mb-3.5">
                <Link
                  href={`/challenge/${t.slug}`}
                  className="flex items-center justify-center w-full bg-acc text-acc-ink font-semibold rounded-md border border-acc cursor-pointer transition-[filter] hover:brightness-105"
                  style={{ padding: 12, fontSize: 13 }}
                >
                  챌린지 시작하기 →
                </Link>
                <div
                  className="font-mono text-text-3 text-center mt-2.5"
                  style={{ fontSize: 10 }}
                >
                  세션은 자동 저장됩니다
                </div>
              </div>

              <div className="bg-bg-1 border border-line rounded-[10px] p-4">
                <div
                  className="font-mono text-text-3 mb-3"
                  style={{ fontSize: 10, letterSpacing: '0.08em' }}
                >
                  BASELINE
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    ['median tokens', '~800'],
                    ['median attempts', '2'],
                    ['median time', '4:00'],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between">
                      <span className="text-text-3" style={{ fontSize: 11.5 }}>
                        {l}
                      </span>
                      <span className="font-mono" style={{ fontSize: 12 }}>
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-line my-3" />
                <div
                  className="font-mono text-text-3 mb-2"
                  style={{ fontSize: 10 }}
                >
                  CONSTRAINTS
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-text-2" style={{ fontSize: 11.5 }}>
                    · max attempts: 5
                  </div>
                  <div className="text-text-2" style={{ fontSize: 11.5 }}>
                    · time limit: 10 min
                  </div>
                </div>
              </div>

              <div className="bg-bg-1 border border-line rounded-[10px] p-4 mt-3.5">
                <div
                  className="font-mono text-text-3 mb-2.5"
                  style={{ fontSize: 10, letterSpacing: '0.08em' }}
                >
                  COMMUNITY
                </div>
                <div className="text-text-2" style={{ fontSize: 12, lineHeight: 1.5 }}>
                  <span className="font-mono text-text-1">{t.attempts}명</span>이 도전했고 완료율은{' '}
                  <span className="font-mono text-acc">{Math.round(t.completion * 100)}%</span>
                  입니다.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
