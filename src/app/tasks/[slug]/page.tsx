'use client';

import { use } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { CategoryTag, DiffTag } from '@/components/Tags';
import { ALL_TASKS } from '@/lib/data';
import { getChallengeDefinition, SCORING_RUBRIC } from '@/lib/challenge';

export default function TaskDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const t = ALL_TASKS.find((x) => x.slug === slug) || ALL_TASKS[0];
  const challenge = getChallengeDefinition(t.slug);

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
            {t.slug} · v{challenge.version}
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
                {challenge.scenario}
              </p>

              {challenge.inputSpec ? (
                <>
                  <div
                    className="font-mono text-text-3 mb-2.5"
                    style={{ fontSize: 10, letterSpacing: '0.08em' }}
                  >
                    INPUT
                  </div>
                  <div
                    className="bg-bg-1 border border-line rounded-md mb-6"
                    style={{ padding: '10px 12px' }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="inline-flex items-center font-mono uppercase text-acc border border-acc-line rounded"
                        style={{ fontSize: 10.5, padding: '2px 7px' }}
                      >
                        {challenge.inputSpec.type}
                      </span>
                      <span className="text-text-2" style={{ fontSize: 12.5 }}>
                        {challenge.inputSpec.description}
                      </span>
                    </div>
                    {challenge.inputSpec.sample ? (
                      <div
                        className="font-mono text-text-3"
                        style={{ fontSize: 11, lineHeight: 1.5 }}
                      >
                        {challenge.inputSpec.sample}
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}

              {challenge.sourceMaterial ? (
                <>
                  <div
                    className="font-mono text-text-3 mb-2.5"
                    style={{ fontSize: 10, letterSpacing: '0.08em' }}
                  >
                    SOURCE MATERIAL
                  </div>
                  <div className="border border-line rounded-md mb-6 overflow-hidden">
                    <div
                      className="flex items-center justify-between bg-bg-1 border-b border-line"
                      style={{ padding: '7px 10px' }}
                    >
                      <span className="text-text-2" style={{ fontSize: 12 }}>
                        {challenge.sourceMaterial.title}
                      </span>
                      <span className="font-mono text-text-3" style={{ fontSize: 10.5 }}>
                        {challenge.sourceMaterial.language}
                      </span>
                    </div>
                    <pre
                      className="font-mono overflow-x-auto whitespace-pre-wrap bg-[#0a0c0f]"
                      style={{ margin: 0, padding: '12px 14px', fontSize: 11.5, lineHeight: 1.6 }}
                    >
                      {challenge.sourceMaterial.content}
                    </pre>
                  </div>
                </>
              ) : null}

              <div
                className="font-mono text-text-3 mb-2.5"
                style={{ fontSize: 10, letterSpacing: '0.08em' }}
              >
                REQUIREMENTS
              </div>
              <div className="flex flex-col gap-2 mb-6">
                {challenge.requirements.map((requirement) => (
                  <div
                    key={requirement.id}
                    className="flex items-start gap-3 bg-bg-1 border border-line rounded-md"
                    style={{ padding: '10px 12px' }}
                  >
                    <div className="font-mono text-acc mt-0.5" style={{ fontSize: 10.5 }}>
                      {requirement.id}
                    </div>
                    <div className="flex-1" style={{ fontSize: 13 }}>
                      {requirement.description}
                    </div>
                    <div className="font-mono text-text-3" style={{ fontSize: 10 }}>
                      w={requirement.weight}
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
                className="font-mono bg-bg-1 border border-line rounded-md mb-6 overflow-x-auto whitespace-pre-wrap"
                style={{ fontSize: 12.5, lineHeight: 1.6, padding: '12px 14px' }}
              >
                {challenge.outputFormat}
              </div>

              <div
                className="font-mono text-text-3 mb-2.5"
                style={{ fontSize: 10, letterSpacing: '0.08em' }}
              >
                TEST CASES <span className="text-text-4">({challenge.testCases.length})</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {challenge.testCases.map((testCase) => (
                  <div
                    key={testCase.id}
                    className="bg-bg-1 border border-line rounded-md"
                    style={{ padding: '8px 12px' }}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-mono text-text-3" style={{ fontSize: 10 }}>
                        {testCase.id}
                      </span>
                      <span
                        className={`inline-flex items-center font-mono uppercase bg-bg-1 rounded ${
                          testCase.type === 'positive'
                            ? 'text-diff-easy border-diff-easy/35'
                            : testCase.type === 'negative'
                              ? 'text-diff-hard border-diff-hard/35'
                              : 'text-text-2 border-line-2'
                        }`}
                        style={{
                          fontSize: 11,
                          padding: '2px 7px',
                          border: '1px solid',
                        }}
                      >
                        {testCase.type}
                      </span>
                    </div>
                    <div className="font-mono text-text-2" style={{ fontSize: 11 }}>
                      {testCase.input ?? testCase.scenario}
                    </div>
                    <div className="font-mono text-text-3 mt-0.5" style={{ fontSize: 11 }}>
                      →{' '}
                      {Array.isArray(testCase.expected)
                        ? JSON.stringify(testCase.expected)
                        : testCase.expected}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="font-mono text-text-3 mb-2.5 mt-6"
                style={{ fontSize: 10, letterSpacing: '0.08em' }}
              >
                PASS CONDITIONS
              </div>
              <div className="flex flex-col gap-1.5">
                {challenge.passConditions.map((condition) => (
                  <div
                    key={condition}
                    className="text-text-2 bg-bg-1 border border-line rounded-md"
                    style={{ padding: '8px 12px', fontSize: 12.5, lineHeight: 1.5 }}
                  >
                    {condition}
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
                <div className="font-mono text-text-3 text-center mt-2.5" style={{ fontSize: 10 }}>
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
                    ['median tokens', `~${challenge.baseline.totalTokens.toLocaleString()}`],
                    ['median attempts', String(challenge.baseline.attempts)],
                    ['median time', `${Math.round(challenge.baseline.timeSeconds / 60)}분`],
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
                <div className="font-mono text-text-3 mb-2" style={{ fontSize: 10 }}>
                  CONSTRAINTS
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-text-2" style={{ fontSize: 11.5 }}>
                    · max attempts: {challenge.maxAttempts}
                  </div>
                  <div className="text-text-2" style={{ fontSize: 11.5 }}>
                    · source: {challenge.sourceDocument}
                  </div>
                </div>
              </div>

              <div className="bg-bg-1 border border-line rounded-[10px] p-4 mt-3.5">
                <div
                  className="font-mono text-text-3 mb-3"
                  style={{ fontSize: 10, letterSpacing: '0.08em' }}
                >
                  SCORING
                </div>
                <div className="flex flex-col gap-2.5">
                  {SCORING_RUBRIC.map((item) => (
                    <div key={item.id}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-text-2" style={{ fontSize: 11.5 }}>
                          {item.label}
                        </span>
                        <span className="font-mono text-text-1" style={{ fontSize: 11 }}>
                          {item.points}pt
                        </span>
                      </div>
                      <div className="text-text-4" style={{ fontSize: 10.5, lineHeight: 1.4 }}>
                        {item.description}
                      </div>
                    </div>
                  ))}
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
