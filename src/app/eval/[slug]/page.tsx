'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';

export default function EvalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(4, s + 1)), 1500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (stage === 4) {
      const t = setTimeout(() => router.push(`/results/${slug}`), 1500);
      return () => clearTimeout(t);
    }
  }, [stage, router, slug]);

  const stages = [
    { id: 'validator', name: 'Validator', desc: '요구사항 충족 검증', dur: '0.5s', model: 'sonnet-4-5' },
    { id: 'quant', name: 'Quantitative', desc: '토큰·시도·시간 분석', dur: '0.1s', model: 'local' },
    {
      id: 'judge',
      name: 'Judge ensemble',
      desc: '명확성·컨텍스트·복구 (×3)',
      dur: '~22s',
      model: 'opus-4-7',
    },
    { id: 'agg', name: 'Aggregator', desc: '난이도 보정 + 백분위', dur: '0.2s', model: 'local' },
  ];

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
            예상 소요 시간 약 25초 · 단계별 결과는 결과 페이지에서 확인할 수 있습니다.
          </p>

          <div className="bg-bg-1 border border-line rounded-[10px] mb-5" style={{ padding: '4px 0' }}>
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
                      <span
                        className="font-mono text-text-4 ml-auto"
                        style={{ fontSize: 10 }}
                      >
                        {s.model}
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
                    {s.dur}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="font-mono text-text-3 text-center" style={{ fontSize: 10.5 }}>
            창을 닫아도 채점은 계속 진행됩니다 · 완료 시 알림
          </div>
        </div>
      </div>
    </div>
  );
}
