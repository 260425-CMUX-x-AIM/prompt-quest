'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Pagination from '@/components/Pagination';
import { CategoryTag, DiffTag } from '@/components/Tags';
import ProgressBar from '@/components/ProgressBar';
import { getErrorMessage } from '@/lib/api/errors';
import type { TaskListItem, ListTasksResponse, ApiError } from '@/lib/api/contracts';

const PAGE_SIZE = 12;

function scoreColor(score: number | null) {
  if (score == null) return 'var(--color-text-4)';
  if (score >= 80) return 'var(--color-acc)';
  if (score >= 60) return 'var(--color-warn)';
  return 'var(--color-err)';
}

function statusLabel(status: NonNullable<TaskListItem['progress']>['last_status']) {
  if (status === 'in_progress') return 'RUN';
  if (status === 'evaluating' || status === 'submitted') return 'WAIT';
  if (status === 'failed') return 'FAIL';
  if (status === 'abandoned') return 'DROP';
  return '—';
}

function TaskRow({ task, onClick }: { task: TaskListItem; onClick: () => void }) {
  const progress = task.progress;
  const attempted = (progress?.attempt_count ?? 0) > 0;
  const solved = (progress?.completed_count ?? 0) > 0;
  const bestScore = progress?.best_score ?? null;

  return (
    <div
      onClick={onClick}
      className="grid items-center border-b border-line transition-colors duration-75 cursor-pointer"
      style={{
        gridTemplateColumns: '24px 1fr 110px 90px 100px 80px 100px',
        gap: 16,
        padding: '14px 18px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--color-bg-1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <div
        className="grid place-items-center rounded font-mono"
        style={{
          width: 16,
          height: 16,
          border: `1px solid ${solved ? 'var(--color-acc)' : 'var(--color-line-2)'}`,
          background: solved ? 'var(--color-acc-dim)' : 'transparent',
          color: solved ? 'var(--color-acc)' : 'var(--color-text-4)',
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        {solved ? '✓' : attempted ? '•' : ''}
      </div>

      <div>
        <div style={{ fontSize: 13.5, marginBottom: 3, fontWeight: 450 }}>{task.title}</div>
        <div className="font-mono text-text-3" style={{ fontSize: 10.5 }}>
          {task.slug}
        </div>
      </div>

      <CategoryTag cat={task.category_slug} />
      <DiffTag level={task.difficulty} />

      <div className="font-mono text-text-3" style={{ fontSize: 11.5 }}>
        ~{task.estimated_minutes}분
      </div>

      <div className="font-mono text-text-3" style={{ fontSize: 11 }}>
        {attempted ? progress?.attempt_count : '—'}
      </div>

      <div className="flex items-center gap-2 justify-end">
        <div
          className="font-mono"
          style={{ fontSize: 11, minWidth: 28, textAlign: 'right', color: scoreColor(bestScore) }}
        >
          {bestScore ?? (attempted ? statusLabel(progress?.last_status ?? null) : '—')}
        </div>
        <div style={{ width: 60 }}>
          <ProgressBar value={bestScore ?? 0} color={scoreColor(bestScore)} height={3} />
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const router = useRouter();
  const [diff, setDiff] = useState('all');
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/tasks')
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as ApiError | null;
          setError(getErrorMessage(data?.error?.code));
          return;
        }
        const data = (await res.json()) as ListTasksResponse;
        setTasks(data.tasks);
      })
      .catch(() => {
        if (!cancelled) setError('태스크 목록을 불러올 수 없습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = tasks.filter((t) => {
    if (diff !== 'all' && t.difficulty !== diff) return false;
    if (cat !== 'all' && t.category_slug !== cat) return false;
    if (q && !t.title.toLowerCase().includes(q.toLowerCase()) && !t.slug.includes(q)) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const difficultyCounts = {
    all: tasks.length,
    easy: tasks.filter((task) => task.difficulty === 'easy').length,
    medium: tasks.filter((task) => task.difficulty === 'medium').length,
    hard: tasks.filter((task) => task.difficulty === 'hard').length,
  };
  const categories = Array.from(new Set(tasks.map((task) => task.category_slug))).sort();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-0 text-text-1">
      <NavBar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className="shrink-0 border-r border-line overflow-y-auto custom-scroll"
          style={{ width: 220, padding: '20px 16px' }}
        >
          <div
            className="font-mono text-text-3 mb-2"
            style={{ fontSize: 10, letterSpacing: '0.08em' }}
          >
            DIFFICULTY
          </div>
          <div className="flex flex-col gap-1 mb-6">
            {(
              [
                ['all', 'All', difficultyCounts.all],
                ['easy', 'Easy', difficultyCounts.easy],
                ['medium', 'Medium', difficultyCounts.medium],
                ['hard', 'Hard', difficultyCounts.hard],
              ] as const
            ).map(([k, l, count]) => (
              <div
                key={k}
                onClick={() => {
                  setDiff(k);
                  setPage(1);
                }}
                className="flex justify-between rounded cursor-pointer"
                style={{
                  padding: '6px 8px',
                  fontSize: 12.5,
                  color: diff === k ? 'var(--color-text-1)' : 'var(--color-text-3)',
                  background: diff === k ? 'var(--color-bg-2)' : 'transparent',
                }}
              >
                <span>{l}</span>
                <span className="font-mono text-text-4">{count}</span>
              </div>
            ))}
          </div>

          <div
            className="font-mono text-text-3 mb-2"
            style={{ fontSize: 10, letterSpacing: '0.08em' }}
          >
            CATEGORY
          </div>
          <div className="flex flex-col gap-0.5">
            <div
              onClick={() => {
                setCat('all');
                setPage(1);
              }}
              className="rounded cursor-pointer"
              style={{
                padding: '5px 8px',
                fontSize: 12,
                color: cat === 'all' ? 'var(--color-text-1)' : 'var(--color-text-3)',
                background: cat === 'all' ? 'var(--color-bg-2)' : 'transparent',
              }}
            >
              All
            </div>
            {categories.map((c) => (
              <div
                key={c}
                onClick={() => {
                  setCat(c);
                  setPage(1);
                }}
                className="font-mono rounded cursor-pointer"
                style={{
                  padding: '5px 8px',
                  fontSize: 12,
                  color: cat === c ? 'var(--color-acc)' : 'var(--color-text-3)',
                  background: cat === c ? 'var(--color-acc-dim)' : 'transparent',
                }}
              >
                {c.toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 overflow-y-auto custom-scroll">
          <div className="border-b border-line" style={{ padding: '24px 28px 16px' }}>
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h1 className="font-medium" style={{ fontSize: 22, margin: 0 }}>
                  Tasks
                </h1>
                <div className="text-text-3 mt-1" style={{ fontSize: 12 }}>
                  {loading ? '불러오는 중…' : `${filtered.length} of ${tasks.length} tasks`}
                </div>
              </div>
              <div className="flex gap-2">
                <div
                  className="flex items-center gap-2 bg-bg-1 border border-line rounded-md"
                  style={{ padding: '7px 12px', width: 240 }}
                >
                  <span className="text-text-4" style={{ fontSize: 13 }}>
                    ⌕
                  </span>
                  <input
                    placeholder="태스크 검색..."
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setPage(1);
                    }}
                    className="font-mono bg-transparent border-none outline-none text-text-1 flex-1"
                    style={{ fontSize: 12 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Header */}
          <div
            className="grid border-b border-line bg-bg-0"
            style={{
              gridTemplateColumns: '24px 1fr 110px 90px 100px 80px 100px',
              gap: 16,
              padding: '10px 18px',
            }}
          >
            {['', 'TASK', 'CATEGORY', 'DIFF', 'TIME', 'ATTEMPTS', 'YOUR BEST'].map((h, i) => (
              <div
                key={i}
                className="font-mono text-text-3"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textAlign: i === 6 ? 'right' : 'left',
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {error && (
            <div className="text-err font-mono p-5" style={{ fontSize: 12 }}>
              {error}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="text-text-3 p-5" style={{ fontSize: 12 }}>
              표시할 태스크가 없습니다.
            </div>
          )}

          {paginated.map((t) => (
            <TaskRow key={t.slug} task={t} onClick={() => router.push(`/tasks/${t.slug}`)} />
          ))}

          {!loading && !error && filtered.length > 0 && (
            <Pagination
              page={currentPage}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="tasks"
              className="p-5"
            />
          )}
        </div>
      </div>
    </div>
  );
}
