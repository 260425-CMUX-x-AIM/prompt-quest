'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import {
  clearPendingEvaluation,
  saveEvaluationResult,
  usePendingEvaluation,
} from '@/lib/evaluation/storage';
import type { EvaluationResult } from '@/lib/evaluation/types';

export default function EvalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pending = usePendingEvaluation();
  const evaluationStartedRef = useRef(false);

  const stages = useMemo(
    () => [
      { id: 'validator', name: 'Validator', desc: '요구사항과 테스트케이스를 검증 중', dur: 'LLM' },
      { id: 'quant', name: 'Quantitative', desc: '토큰·시도·시간을 점수화하는 중', dur: 'local' },
      { id: 'judge', name: 'Judge', desc: '명확성·컨텍스트·복구를 평가 중', dur: 'LLM' },
      { id: 'agg', name: 'Aggregator', desc: '100점 만점으로 최종 합산 중', dur: 'local' },
    ],
    [],
  );

  useEffect(() => {
    if (!pending || pending.slug !== slug) {
      return;
    }

    if (evaluationStartedRef.current) {
      return;
    }

    evaluationStartedRef.current = true;
    const timer = window.setInterval(() => {
      setStage((current) => Math.min(stages.length - 1, current + 1));
    }, 1100);

    async function evaluate() {
      try {
        const response = await fetch('/api/challenge-evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pending),
        });

        const data = (await response.json()) as EvaluationResult | { error: string };

        if (!response.ok || !('totalScore' in data)) {
          throw new Error('error' in data ? data.error : '채점 API 응답 처리에 실패했습니다.');
        }

        saveEvaluationResult(data);
        clearPendingEvaluation();
        setStage(stages.length);
        router.push(`/results/${slug}`);
      } catch (evaluationError) {
        setError(
          evaluationError instanceof Error
            ? evaluationError.message
            : '채점 파이프라인 실행 중 오류가 발생했습니다.',
        );
      } finally {
        window.clearInterval(timer);
      }
    }

    void evaluate();

    return () => {
      window.clearInterval(timer);
    };
  }, [pending, router, slug, stages]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-0 text-text-1">
      <NavBar />
      <div className="flex-1 flex items-center justify-center" style={{ padding: 40 }}>
        <div className="w-full" style={{ maxWidth: 620 }}>
          <div
            className="font-mono text-text-3 mb-3"
            style={{ fontSize: 11, letterSpacing: '0.08em' }}
          >
            <span
              className="inline-block w-[7px] h-[7px] rounded-full mr-2"
              style={{ background: 'var(--color-warn)' }}
            />
            EVALUATING · session #s_8nfpx2
          </div>
          <h1 className="font-medium mb-1.5" style={{ fontSize: 28, letterSpacing: '-0.01em' }}>
            채점 진행 중
          </h1>
          <p className="text-text-2 mb-8" style={{ fontSize: 14 }}>
            최종 점수는 100점 만점으로 계산됩니다. 완료되면 결과 페이지로 자동 이동합니다.
          </p>
          {error ? (
            <div
              className="mb-5 rounded border"
              style={{
                padding: '10px 12px',
                fontSize: 12.5,
                borderColor: 'rgba(255, 119, 77, 0.35)',
                color: 'var(--color-err)',
                background: 'rgba(255, 119, 77, 0.08)',
              }}
            >
              {error}
            </div>
          ) : null}
          {!pending || pending.slug !== slug ? (
            stage === 0 ? (
              <div
                className="mb-5 rounded border"
                style={{
                  padding: '10px 12px',
                  fontSize: 12.5,
                  borderColor: 'rgba(255, 119, 77, 0.35)',
                  color: 'var(--color-err)',
                  background: 'rgba(255, 119, 77, 0.08)',
                }}
              >
                채점할 제출 데이터가 없습니다. 챌린지 화면에서 다시 제출해 주세요.
              </div>
            ) : null
          ) : null}

          <div
            className="bg-bg-1 border border-line rounded-[10px] mb-5"
            style={{ padding: '4px 0' }}
          >
            {stages.map((s, i) => {
              const status = i < stage ? 'done' : i === stage ? 'running' : 'pending';
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3.5"
                  style={{
                    padding: '14px 18px',
                    borderBottom: i < stages.length - 1 ? '1px solid var(--color-line)' : 'none',
                    opacity: status === 'pending' ? 0.4 : 1,
                  }}
                >
                  <div
                    className="grid place-items-center rounded-full shrink-0"
                    style={{
                      width: 24,
                      height: 24,
                      background:
                        status === 'done'
                          ? 'var(--color-acc)'
                          : status === 'running'
                            ? 'transparent'
                            : 'var(--color-bg-3)',
                      border:
                        status === 'running'
                          ? '2px solid var(--color-warn)'
                          : '2px solid transparent',
                      color: 'var(--color-acc-ink)',
                      fontSize: 12,
                      fontWeight: 700,
                      animation: status === 'running' ? 'spin-slow 1.5s linear infinite' : 'none',
                    }}
                  >
                    {status === 'done' && '✓'}
                    {status === 'running' && (
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: 'var(--color-warn)' }}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-text-3" style={{ fontSize: 9.5 }}>
                        STAGE {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="font-medium" style={{ fontSize: 13.5 }}>
                        {s.name}
                      </span>
                      <span className="font-mono text-text-4 ml-auto" style={{ fontSize: 10 }}>
                        {s.dur}
                      </span>
                    </div>
                    <div className="text-text-3" style={{ fontSize: 12 }}>
                      {s.desc}
                    </div>
                    {status === 'running' && (
                      <div
                        className="mt-1.5 rounded overflow-hidden"
                        style={{ height: 2, background: 'var(--color-bg-3)' }}
                      >
                        <div
                          className="h-full animate-shimmer"
                          style={{ width: '60%', background: 'var(--color-warn)' }}
                        />
                      </div>
                    )}
                  </div>
                  <span
                    className="font-mono text-text-3 text-right"
                    style={{ fontSize: 11, minWidth: 40 }}
                  >
                    {status === 'done' ? 'done' : status === 'running' ? '...' : 'wait'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="font-mono text-text-3 text-center" style={{ fontSize: 10.5 }}>
            로그인 없는 데모 모드에서는 이 탭에 결과를 임시 저장합니다.
          </div>
        </div>
      </div>
    </div>
  );
}
