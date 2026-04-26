'use client';

import { useState, useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { AggregatedResult, EvaluationStage } from '@/lib/types/evaluation';
import type { EvaluationResponse } from '@/lib/api/contracts';

const STAGE_ORDER = ['validator', 'quantitative', 'judge', 'aggregator'] as const;
const STAGE_LABELS: Record<(typeof STAGE_ORDER)[number], string> = {
  validator: '검증',
  quantitative: '효율 분석',
  judge: '품질 채점',
  aggregator: '점수 합산',
};

// Realtime + 10초 폴링 하이브리드. StrictMode/HMR 더블 마운트 누수 방지를 위해 useRef 사용.
// 사양: docs/part-a-plan.md Day 7 코드 예시 + 검토 #5/#6/#17
export function EvaluationProgress({
  sessionId,
  initialStages,
  initialEvaluation,
  initialStatus,
  onEvaluated,
}: {
  sessionId: string;
  initialStages: EvaluationStage[];
  initialEvaluation: AggregatedResult | null;
  initialStatus: EvaluationResponse['status'];
  onEvaluated?: (evaluation: AggregatedResult) => void;
}) {
  const supabase = createClient();
  const [stages, setStages] = useState<EvaluationStage[]>(initialStages);
  const [status, setStatus] = useState(initialStatus);
  const [, setEvaluation] = useState<AggregatedResult | null>(initialEvaluation);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (status === 'evaluated' || status === 'failed') return;
    if (channelRef.current) return; // StrictMode 더블 마운트 가드

    const ch = supabase
      .channel(`eval-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evaluation_stages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newStage = payload.new as EvaluationStage;
          setStages((prev) => {
            const idx = prev.findIndex((s) => s.stage === newStage.stage);
            if (idx === -1) return [...prev, newStage];
            const next = [...prev];
            next[idx] = newStage;
            return next;
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'evaluations',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const evalData = payload.new as AggregatedResult;
          setEvaluation(evalData);
          setStatus('evaluated');
          onEvaluated?.(evalData);
        },
      )
      .subscribe();

    channelRef.current = ch;

    // 폴링 fallback (10초)
    const pollId = setInterval(async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/evaluation`);
        if (!res.ok) return;
        const data: EvaluationResponse = await res.json();
        setStages(data.stages);
        setStatus(data.status);
        if (data.evaluation) {
          setEvaluation(data.evaluation);
          if (data.status === 'evaluated') onEvaluated?.(data.evaluation);
        }
        if (data.status === 'evaluated' || data.status === 'failed') {
          clearInterval(pollId);
        }
      } catch {
        // ignore — Realtime 으로 들어올 수도 있음
      }
    }, 10_000);

    return () => {
      supabase.removeChannel(ch);
      clearInterval(pollId);
      channelRef.current = null;
    };
  }, [sessionId, supabase, status, onEvaluated]);

  if (status === 'evaluated') return null;

  return (
    <div className="bg-bg-1 border border-line rounded-[10px] p-4">
      <div
        className="font-mono text-text-3 mb-3"
        style={{ fontSize: 11, letterSpacing: '0.06em' }}
      >
        ─── 채점 진행 중
      </div>
      <div className="flex flex-col gap-2">
        {STAGE_ORDER.map((stageName) => {
          const stage = stages.find((s) => s.stage === stageName);
          const stageStatus = stage?.status ?? 'pending';
          const color =
            stageStatus === 'success'
              ? 'var(--color-acc)'
              : stageStatus === 'failed'
                ? 'var(--color-err)'
                : stageStatus === 'running'
                  ? 'var(--color-warn)'
                  : 'var(--color-text-4)';
          const symbol =
            stageStatus === 'success'
              ? '✓'
              : stageStatus === 'failed'
                ? '✗'
                : stageStatus === 'running'
                  ? '◐'
                  : '○';
          return (
            <div
              key={stageName}
              className="flex items-center gap-3 text-text-2"
              style={{ fontSize: 12 }}
            >
              <span className="font-mono inline-block" style={{ width: 14, color }}>
                {symbol}
              </span>
              <span>{STAGE_LABELS[stageName]}</span>
              {stage?.duration_ms != null && (
                <span className="font-mono text-text-4 ml-auto" style={{ fontSize: 11 }}>
                  {(stage.duration_ms / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          );
        })}
      </div>
      {status === 'failed' && (
        <div className="mt-3 text-err font-mono" style={{ fontSize: 11.5 }}>
          채점이 실패했습니다. 다시 제출하거나 분쟁을 신청해 주세요.
        </div>
      )}
    </div>
  );
}
