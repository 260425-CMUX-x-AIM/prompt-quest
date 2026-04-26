'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { CategoryTag, DiffTag } from '@/components/Tags';
import StatChip from '@/components/StatChip';
import ProgressBar from '@/components/ProgressBar';
import { EvaluationProgress } from '@/components/EvaluationProgress';
import { DisputeModal } from '@/components/DisputeModal';
import { getErrorMessage } from '@/lib/api/errors';
import type {
  GetSessionResponse,
  EvaluationResponse,
  ApiError,
} from '@/lib/api/contracts';
import type { AggregatedResult } from '@/lib/types/evaluation';

const SCORE_MAX = {
  correctness: 40,
  efficiency: 40,
  context: 20,
  recovery: 10,
  clarity: 10,
  pattern_bonus: 5,
} as const;

const SCORE_LABELS: Record<keyof typeof SCORE_MAX, string> = {
  correctness: '정확성',
  efficiency: '효율성',
  context: '컨텍스트 활용',
  recovery: '에러 복구',
  clarity: '프롬프트 명확성',
  pattern_bonus: '패턴 가산',
};

function elapsed(startIso: string, endIso: string | null): string {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const sec = Math.max(0, Math.floor((end - start) / 1000));
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function pctColor(pct: number): string {
  if (pct > 80) return 'var(--color-acc)';
  if (pct > 50) return 'var(--color-warn)';
  return 'var(--color-err)';
}

export default function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);

  const [session, setSession] = useState<GetSessionResponse | null>(null);
  const [evaluationData, setEvaluationData] = useState<EvaluationResponse | null>(null);
  const [evaluation, setEvaluation] = useState<AggregatedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disputeOpen, setDisputeOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/sessions/${sessionId}`).then(async (res) =>
        res.ok ? ((await res.json()) as GetSessionResponse) : null,
      ),
      fetch(`/api/sessions/${sessionId}/evaluation`).then(async (res) => {
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as ApiError | null;
          throw new Error(getErrorMessage(data?.error?.code));
        }
        return (await res.json()) as EvaluationResponse;
      }),
    ])
      .then(([sess, evalRes]) => {
        if (cancelled) return;
        setSession(sess);
        setEvaluationData(evalRes);
        if (evalRes.evaluation) setEvaluation(evalRes.evaluation);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message ?? '결과를 불러올 수 없습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // evaluations.id 가 contracts 에 노출되지 않아 MVP 에서는 sessionId 를 임시 식별자로 사용.
  // (실제 dispute 라우트는 B 가 sessionId↔evaluationId 매핑 처리)
  const evaluationId = sessionId;

  if (loading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-bg-0 text-text-1">
        <NavBar />
        <div className="flex-1 grid place-items-center text-text-3" style={{ fontSize: 12 }}>
          결과를 불러오는 중…
        </div>
      </div>
    );
  }

  if (error || !session || !evaluationData) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-bg-0 text-text-1">
        <NavBar />
        <div className="flex-1 grid place-items-center">
          <div className="text-err font-mono" style={{ fontSize: 13 }}>
            {error ?? '결과를 찾을 수 없습니다.'}
          </div>
        </div>
      </div>
    );
  }

  const status = evaluationData.status;
  const sess = session.session;
  const taskMeta = session.task.metadata;
  const submittedArtifact =
    session.artifacts.find((artifact) => artifact.is_final) ?? session.artifacts.at(-1) ?? null;
  const isEvaluating = status === 'evaluating' && !evaluation;

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
                  {evaluation ? evaluation.total_score : '—'}
                </span>
                <span
                  className="font-mono text-text-3"
                  style={{ fontSize: 18, marginBottom: 14 }}
                >
                  /100
                </span>
              </div>
              {evaluation && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  <span
                    className="inline-flex items-center font-mono uppercase text-acc border rounded"
                    style={{
                      fontSize: 11,
                      padding: '2px 7px',
                      borderColor: 'var(--color-acc-line)',
                      background: 'var(--color-acc-dim)',
                    }}
                  >
                    백분위 {evaluation.percentile.toFixed(1)}
                  </span>
                  {evaluation.meta.is_low_confidence && (
                    <span
                      className="inline-flex items-center font-mono text-text-2 border border-warn rounded"
                      style={{ fontSize: 11, padding: '2px 7px', color: 'var(--color-warn)' }}
                      title="표본이 적거나 채점 분산이 커서 신뢰도가 낮습니다."
                    >
                      ⚠ 신뢰도 낮음
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <CategoryTag cat={taskMeta.category} />
                <DiffTag level={taskMeta.difficulty} />
                <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
                  {taskMeta.id}
                </span>
              </div>
              <h1 className="font-medium mb-3.5" style={{ fontSize: 26 }}>
                {taskMeta.title}
              </h1>
              <div className="grid grid-cols-4 gap-2">
                <StatChip label="시도" value={`${sess.attempt_count}회`} accent />
                <StatChip
                  label="시간"
                  value={elapsed(sess.started_at, sess.evaluated_at ?? sess.submitted_at)}
                />
                <StatChip
                  label="토큰"
                  value={(sess.total_input_tokens + sess.total_output_tokens).toLocaleString()}
                />
                <StatChip label="메시지" value={String(sess.message_count)} />
              </div>
            </div>
          </div>

          {submittedArtifact && (
            <div className="mb-7">
              <div
                className="font-mono text-text-3 mb-3.5"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                ─── SUBMITTED ANSWER
              </div>
              <div className="bg-bg-1 border border-line rounded-[10px] overflow-hidden">
                <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                  <div className="font-mono text-text-3" style={{ fontSize: 11 }}>
                    version {submittedArtifact.version}
                    {submittedArtifact.is_final ? ' · final' : ''}
                  </div>
                  <div className="font-mono text-text-4" style={{ fontSize: 10 }}>
                    {submittedArtifact.language ?? session.task.artifact_format.language}
                  </div>
                </div>
                <pre
                  className="custom-scroll overflow-x-auto text-text-2"
                  style={{
                    margin: 0,
                    padding: '16px 18px',
                    fontSize: 12.5,
                    lineHeight: 1.65,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {submittedArtifact.content}
                </pre>
              </div>
            </div>
          )}

          {/* 채점 진행 또는 결과 */}
          {isEvaluating && (
            <div className="mb-7">
              <EvaluationProgress
                sessionId={sessionId}
                initialStages={evaluationData.stages}
                initialEvaluation={evaluationData.evaluation}
                initialStatus={evaluationData.status}
                onEvaluated={(ev) => setEvaluation(ev)}
              />
            </div>
          )}

          {evaluation && (
            <>
              {/* Breakdown */}
              <div className="grid gap-7" style={{ gridTemplateColumns: '1fr 320px' }}>
                <div>
                  <div
                    className="font-mono text-text-3 mb-3.5"
                    style={{ fontSize: 11, letterSpacing: '0.08em' }}
                  >
                    ─── BREAKDOWN
                  </div>
                  <div className="bg-bg-1 border border-line rounded-[10px] overflow-hidden">
                    {(Object.keys(SCORE_MAX) as Array<keyof typeof SCORE_MAX>).map((k, i, arr) => {
                      const score = evaluation.scores[k] ?? 0;
                      const max = SCORE_MAX[k];
                      const pct = max ? (score / max) * 100 : 0;
                      return (
                        <div
                          key={k}
                          style={{
                            padding: '16px 18px',
                            borderBottom:
                              i < arr.length - 1 ? '1px solid var(--color-line)' : 'none',
                          }}
                        >
                          <div className="flex justify-between items-baseline mb-1.5">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="font-mono text-text-3"
                                style={{ fontSize: 10 }}
                              >
                                {String(i + 1).padStart(2, '0')}
                              </span>
                              <span className="font-medium" style={{ fontSize: 14 }}>
                                {SCORE_LABELS[k]}
                              </span>
                              <span
                                className="font-mono text-text-4"
                                style={{ fontSize: 10 }}
                              >
                                {k}
                              </span>
                            </div>
                            <div className="font-mono" style={{ fontSize: 13 }}>
                              <span
                                className="font-semibold"
                                style={{ color: pctColor(pct) }}
                              >
                                {score}
                              </span>
                              <span className="text-text-4"> / {max}</span>
                            </div>
                          </div>
                          <ProgressBar value={pct} color={pctColor(pct)} height={4} />
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
                  <div className="flex flex-col gap-3.5">
                    {[
                      {
                        label: '잘한 점',
                        tone: 'var(--color-acc)',
                        border: 'var(--color-acc-line)',
                        body: evaluation.feedback.good || '—',
                      },
                      {
                        label: '개선할 점',
                        tone: 'var(--color-warn)',
                        border: 'var(--color-line)',
                        body: evaluation.feedback.improve || '—',
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-bg-1 border rounded-[10px] overflow-hidden"
                        style={{ borderColor: item.border }}
                      >
                        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                          <div
                            className="font-mono"
                            style={{
                              fontSize: 10,
                              letterSpacing: '0.06em',
                              color: item.tone,
                            }}
                          >
                            ◆ {item.label}
                          </div>
                          <div className="font-mono text-text-4" style={{ fontSize: 10 }}>
                            FEEDBACK
                          </div>
                        </div>
                        <div
                          className="custom-scroll overflow-y-auto text-text-2"
                          style={{
                            maxHeight: 180,
                            padding: '14px 16px',
                            fontSize: 13,
                            lineHeight: 1.75,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {item.body}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Aside */}
                <div>
                  <div
                    className="font-mono text-text-3 mb-3.5"
                    style={{ fontSize: 11, letterSpacing: '0.08em' }}
                  >
                    ─── META
                  </div>
                  <div className="bg-bg-1 border border-line rounded-[10px] p-4 mb-4.5">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between">
                        <span className="text-text-3" style={{ fontSize: 11.5 }}>
                          baseline
                        </span>
                        <span className="font-mono" style={{ fontSize: 11.5 }}>
                          {evaluation.meta.baseline_source}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-3" style={{ fontSize: 11.5 }}>
                          judge runs
                        </span>
                        <span className="font-mono" style={{ fontSize: 11.5 }}>
                          {evaluation.meta.judge_runs_succeeded} / 3
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-3" style={{ fontSize: 11.5 }}>
                          max stddev
                        </span>
                        <span className="font-mono" style={{ fontSize: 11.5 }}>
                          {evaluation.meta.judge_max_stddev.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <Link
                      href="/tasks"
                      className="flex-1 flex items-center justify-center rounded border border-line text-text-1 bg-transparent hover:bg-bg-2 cursor-pointer"
                      style={{ fontSize: 12, padding: '5px 10px' }}
                    >
                      ↻ 다른 태스크
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDisputeOpen(true)}
                      className="flex-1 flex items-center justify-center rounded border border-line text-text-1 bg-transparent hover:bg-bg-2 cursor-pointer"
                      style={{ fontSize: 12, padding: '5px 10px' }}
                    >
                      ⚑ 이의 신청
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {status === 'failed' && !evaluation && (
            <div className="bg-bg-1 border border-line rounded-[10px] p-5 text-err font-mono" style={{ fontSize: 13 }}>
              채점이 실패했습니다. 다시 제출하거나 분쟁을 신청해 주세요.
            </div>
          )}
        </div>
      </div>

      {disputeOpen && evaluationId && (
        <DisputeModal evaluationId={evaluationId} onClose={() => setDisputeOpen(false)} />
      )}
    </div>
  );
}
