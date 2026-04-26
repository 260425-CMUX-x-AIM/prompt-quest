'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { CategoryTag, DiffTag } from '@/components/Tags';
import ProgressBar from '@/components/ProgressBar';
import { ALL_TASKS, CATEGORIES, type Task } from '@/lib/data';

function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const isDone = !!task.completed;
  return (
    <div
      onClick={onClick}
      className="grid items-center border-b border-line transition-colors duration-75"
      style={{
        gridTemplateColumns: '24px 1fr 110px 90px 100px 80px 100px',
        gap: 16,
        padding: '14px 18px',
        cursor: task.locked ? 'not-allowed' : 'pointer',
        opacity: task.locked ? 0.45 : 1,
      }}
      onMouseEnter={(e) => {
        if (!task.locked) e.currentTarget.style.background = 'var(--color-bg-1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <div
        className="grid place-items-center rounded"
        style={{
          width: 16,
          height: 16,
          border: `1px solid ${isDone ? 'var(--color-acc)' : 'var(--color-line-2)'}`,
          background: isDone ? 'var(--color-acc)' : 'transparent',
          color: 'var(--color-acc-ink)',
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        {isDone && '✓'}
      </div>

      <div>
        <div style={{ fontSize: 13.5, marginBottom: 3, fontWeight: 450 }}>
          {task.locked && (
            <span className="text-text-4 mr-1.5" style={{ fontSize: 12 }}>
              🔒
            </span>
          )}
          {task.title}
        </div>
        <div className="font-mono text-text-3" style={{ fontSize: 10.5 }}>
          {task.slug}
        </div>
      </div>

      <CategoryTag cat={task.cat} />
      <DiffTag level={task.diff} />

      <div className="font-mono text-text-3" style={{ fontSize: 11.5 }}>
        ~{task.mins}분
      </div>

      <div className="font-mono text-text-3" style={{ fontSize: 11 }}>
        {task.attempts}회
      </div>

      <div className="flex items-center gap-2 justify-end">
        {isDone ? (
          <div className="font-mono text-acc" style={{ fontSize: 11 }}>
            {task.completed}
          </div>
        ) : (
          <div style={{ width: 60 }}>
            <ProgressBar value={task.completion * 100} color="var(--color-text-4)" height={3} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const router = useRouter();
  const [diff, setDiff] = useState('all');
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const difficultyCounts = {
    all: ALL_TASKS.length,
    easy: ALL_TASKS.filter((task) => task.diff === 'easy').length,
    medium: ALL_TASKS.filter((task) => task.diff === 'medium').length,
    hard: ALL_TASKS.filter((task) => task.diff === 'hard').length,
  };
  const completedCount = ALL_TASKS.filter((task) => task.completed).length;

  const filtered = ALL_TASKS.filter((t) => {
    if (diff !== 'all' && t.diff !== diff) return false;
    if (cat !== 'all' && t.cat !== cat) return false;
    if (q && !t.title.toLowerCase().includes(q.toLowerCase()) && !t.slug.includes(q)) return false;
    return true;
  });

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
            ).map(([k, l, c]) => (
              <div
                key={k}
                onClick={() => setDiff(k)}
                className="flex justify-between rounded cursor-pointer"
                style={{
                  padding: '6px 8px',
                  fontSize: 12.5,
                  color: diff === k ? 'var(--color-text-1)' : 'var(--color-text-3)',
                  background: diff === k ? 'var(--color-bg-2)' : 'transparent',
                }}
              >
                <span>{l}</span>
                <span className="font-mono text-text-4" style={{ fontSize: 10 }}>
                  {c}
                </span>
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
              onClick={() => setCat('all')}
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
            {CATEGORIES.map((c) => (
              <div
                key={c}
                onClick={() => setCat(c)}
                className="font-mono rounded cursor-pointer"
                style={{
                  padding: '5px 8px',
                  fontSize: 12,
                  color: cat === c ? 'var(--color-acc)' : 'var(--color-text-3)',
                  background: cat === c ? 'var(--color-acc-dim)' : 'transparent',
                }}
              >
                {c}
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
                  {filtered.length} of {ALL_TASKS.length} tasks · {completedCount} completed
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
                    onChange={(e) => setQ(e.target.value)}
                    className="font-mono bg-transparent border-none outline-none text-text-1 flex-1"
                    style={{ fontSize: 12 }}
                  />
                  <span
                    className="font-mono text-text-2 rounded"
                    style={{
                      fontSize: 10.5,
                      padding: '1px 5px',
                      background: 'var(--color-bg-2)',
                      border: '1px solid var(--color-line-2)',
                      borderBottomWidth: 2,
                    }}
                  >
                    /
                  </span>
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

          {filtered.map((t) => (
            <TaskRow
              key={t.slug}
              task={t}
              onClick={() => {
                if (!t.locked) router.push(`/tasks/${t.slug}`);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
