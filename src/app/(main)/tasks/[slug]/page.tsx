'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { CategoryTag, DiffTag } from '@/components/Tags';
import TaskReferenceMaterial from '@/components/TaskReferenceMaterial';
import { getErrorMessage } from '@/lib/api/errors';
import type { GetTaskResponse, CreateSessionResponse, ApiError } from '@/lib/api/contracts';

type TaskDetail = GetTaskResponse['task'];

export default function TaskDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/tasks/${slug}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as ApiError | null;
          setError(getErrorMessage(data?.error?.code));
          return;
        }
        const data = (await res.json()) as GetTaskResponse;
        setTask(data.task);
      })
      .catch(() => {
        if (!cancelled) setError('태스크를 불러올 수 없습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function startSession() {
    if (starting || !task) return;
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_slug: task.slug }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as ApiError | null;
        setStartError(getErrorMessage(data?.error?.code));
        setStarting(false);
        return;
      }
      const data = (await res.json()) as CreateSessionResponse;
      router.push(`/challenge/${data.session_id}`);
    } catch {
      setStartError('세션 시작에 실패했습니다.');
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-bg-0 text-text-1">
        <NavBar />
        <div className="flex-1 grid place-items-center text-text-3" style={{ fontSize: 12 }}>
          불러오는 중…
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-bg-0 text-text-1">
        <NavBar />
        <div className="flex-1 grid place-items-center">
          <div className="text-err font-mono" style={{ fontSize: 13 }}>
            {error ?? '태스크를 찾을 수 없습니다.'}
          </div>
        </div>
      </div>
    );
  }

  const stubText = task.artifact_format.stub ?? '';

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
            <CategoryTag cat={task.category_slug} />
            <DiffTag level={task.difficulty} />
            <span
              className="inline-flex items-center font-mono text-text-2 bg-bg-1 border border-line-2 rounded"
              style={{ fontSize: 11, padding: '2px 7px' }}
            >
              ~{task.estimated_minutes}min
            </span>
          </div>

          <h1 className="font-medium mb-1.5" style={{ fontSize: 30, letterSpacing: '-0.01em' }}>
            {task.title}
          </h1>
          <div className="font-mono text-text-3 mb-7" style={{ fontSize: 12 }}>
            {task.slug} · v{task.metadata.version}
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
                {task.context.scenario || task.context.background}
              </p>

              <TaskReferenceMaterial context={task.context} />

              <div
                className="font-mono text-text-3 mb-2.5"
                style={{ fontSize: 10, letterSpacing: '0.08em' }}
              >
                REQUIREMENTS
              </div>
              <div className="flex flex-col gap-2 mb-6">
                {task.requirements.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-start gap-3 bg-bg-1 border border-line rounded-md"
                    style={{ padding: '10px 12px' }}
                  >
                    <div className="font-mono text-acc mt-0.5" style={{ fontSize: 10.5 }}>
                      {req.id}
                    </div>
                    <div className="flex-1" style={{ fontSize: 13 }}>
                      {req.description}
                    </div>
                    {req.weight != null && (
                      <div className="font-mono text-text-3" style={{ fontSize: 10 }}>
                        w={req.weight}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div
                className="font-mono text-text-3 mb-2.5"
                style={{ fontSize: 10, letterSpacing: '0.08em' }}
              >
                OUTPUT FORMAT — {task.artifact_format.language}
              </div>
              <div
                className="font-mono bg-[#0a0c0f] border border-line rounded-md mb-6 overflow-x-auto whitespace-pre"
                style={{ fontSize: 12.5, lineHeight: 1.6, padding: '12px 14px' }}
              >
                {stubText || '(자유 형식)'}
              </div>
            </div>

            {/* Aside */}
            <div className="sticky top-5">
              <div className="bg-bg-1 border border-line rounded-[10px] p-4.5 mb-3.5">
                <button
                  type="button"
                  onClick={startSession}
                  disabled={starting}
                  className="flex items-center justify-center w-full bg-acc text-acc-ink font-semibold rounded-md border border-acc cursor-pointer transition-[filter] hover:brightness-105 disabled:opacity-50"
                  style={{ padding: 12, fontSize: 13 }}
                >
                  {starting ? '세션 시작 중…' : '챌린지 시작하기 →'}
                </button>
                {startError && (
                  <div className="text-err font-mono mt-2" style={{ fontSize: 11.5 }}>
                    {startError}
                  </div>
                )}
                <div className="font-mono text-text-3 text-center mt-2.5" style={{ fontSize: 10 }}>
                  세션은 자동 저장됩니다
                </div>
              </div>

              <div className="bg-bg-1 border border-line rounded-[10px] p-4">
                <div className="font-mono text-text-3 mb-2" style={{ fontSize: 10 }}>
                  CONSTRAINTS
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-text-2" style={{ fontSize: 11.5 }}>
                    · max attempts: {task.constraints.max_attempts}
                  </div>
                  <div className="text-text-2" style={{ fontSize: 11.5 }}>
                    · time limit: {Math.round(task.constraints.time_limit_seconds / 60)} min
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
