'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Pagination from '@/components/Pagination';
import { CategoryTag, DiffTag } from '@/components/Tags';
import { getErrorMessage } from '@/lib/api/errors';
import type { MeSessionsResponse, MeSessionsItem, ApiError } from '@/lib/api/contracts';
import type { SessionStatus } from '@/lib/types/session';

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<SessionStatus, string> = {
  in_progress: '진행 중',
  submitted: '제출됨',
  evaluating: '채점 중',
  evaluated: '완료',
  failed: '실패',
  abandoned: '포기',
};

const STATUS_FILTERS: Array<{ value: 'all' | SessionStatus; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'in_progress', label: '진행 중' },
  { value: 'evaluated', label: '완료' },
  { value: 'failed', label: '실패' },
  { value: 'abandoned', label: '포기' },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}/${day}`;
}

function scoreColor(score: number | null) {
  if (score == null) return 'var(--color-text-4)';
  if (score >= 80) return 'var(--color-acc)';
  if (score >= 60) return 'var(--color-warn)';
  return 'var(--color-err)';
}

export default function MyPage() {
  const [filter, setFilter] = useState<'all' | SessionStatus>('all');
  const [page, setPage] = useState(1);
  const [sessions, setSessions] = useState<MeSessionsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (filter !== 'all') params.set('status', filter);
    fetch(`/api/me/sessions?${params}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as ApiError | null;
          setError(getErrorMessage(data?.error?.code));
          return;
        }
        const data = (await res.json()) as MeSessionsResponse;
        setError(null);
        setSessions(data.sessions);
        setTotal(data.total);
      })
      .catch(() => {
        if (!cancelled) setError('세션 목록을 불러올 수 없습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, page]);

  const evaluatedCount = sessions.filter((s) => s.status === 'evaluated').length;
  const totalTokens = sessions.reduce(
    (sum, s) => sum + s.total_input_tokens + s.total_output_tokens,
    0,
  );
  const avgScore = (() => {
    const scored = sessions.filter((s) => s.total_score != null);
    if (scored.length === 0) return null;
    const sum = scored.reduce((a, s) => a + (s.total_score ?? 0), 0);
    return (sum / scored.length).toFixed(1);
  })();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-0 text-text-1">
      <NavBar />
      <div className="flex-1 overflow-y-auto custom-scroll">
        <div className="max-w-[1100px] mx-auto" style={{ padding: '32px 36px' }}>
          <h1 className="font-medium mb-7" style={{ fontSize: 26 }}>
            My
          </h1>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5 mb-7">
            {(
              [
                ['avg score', avgScore ?? '—', 'var(--color-acc)'],
                ['solved', String(evaluatedCount), null],
                ['total tokens', totalTokens.toLocaleString(), null],
              ] as [string, string, string | null][]
            ).map(([l, v, c]) => (
              <div key={l} className="bg-bg-1 border border-line rounded-[10px] p-4">
                <div
                  className="font-mono text-text-3 uppercase mb-1.5"
                  style={{ fontSize: 10, letterSpacing: '0.06em' }}
                >
                  {l}
                </div>
                <div
                  className="font-mono font-medium"
                  style={{ fontSize: 22, color: c || 'var(--color-text-1)' }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-3.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  setFilter(f.value);
                  setPage(1);
                }}
                className="rounded font-mono"
                style={{
                  padding: '5px 10px',
                  fontSize: 11.5,
                  letterSpacing: '0.04em',
                  color: filter === f.value ? 'var(--color-text-1)' : 'var(--color-text-3)',
                  background: filter === f.value ? 'var(--color-bg-2)' : 'transparent',
                  border: '1px solid var(--color-line)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div
            className="font-mono text-text-3 mb-3"
            style={{ fontSize: 11, letterSpacing: '0.08em' }}
          >
            ─── HISTORY · {total} SESSIONS
          </div>

          {error && (
            <div className="text-err font-mono mb-3" style={{ fontSize: 12 }}>
              {error}
            </div>
          )}

          <div className="bg-bg-1 border border-line rounded-[10px] overflow-hidden">
            <div
              className="grid gap-3 border-b border-line bg-bg-1"
              style={{
                gridTemplateColumns: '60px 1fr 110px 80px 70px 80px',
                padding: '8px 16px',
              }}
            >
              {['DATE', 'TASK', 'CATEGORY', 'DIFF', 'SCORE', 'STATUS'].map((h) => (
                <div
                  key={h}
                  className="font-mono text-text-3"
                  style={{ fontSize: 9.5, letterSpacing: '0.06em' }}
                >
                  {h}
                </div>
              ))}
            </div>

            {loading && (
              <div className="text-text-3 p-5" style={{ fontSize: 12 }}>
                불러오는 중…
              </div>
            )}
            {!loading && sessions.length === 0 && (
              <div className="text-text-3 p-5" style={{ fontSize: 12 }}>
                아직 도전한 태스크가 없습니다.{' '}
                <Link href="/tasks" className="underline">
                  태스크 목록 →
                </Link>
              </div>
            )}

            {sessions.map((s, i) => {
              const isInProgress = s.status === 'in_progress';
              const target = isInProgress ? `/challenge/${s.id}` : `/results/${s.id}`;
              return (
                <Link
                  key={s.id}
                  href={target}
                  className="grid gap-3 items-center border-b border-line hover:bg-bg-2"
                  style={{
                    gridTemplateColumns: '60px 1fr 110px 80px 70px 80px',
                    padding: '12px 16px',
                    borderBottom: i < sessions.length - 1 ? '1px solid var(--color-line)' : 'none',
                    opacity: s.status === 'abandoned' ? 0.45 : 1,
                  }}
                >
                  <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
                    {formatDate(s.started_at)}
                  </span>
                  <span style={{ fontSize: 13 }}>{s.task.title}</span>
                  <CategoryTag cat={s.task.category} />
                  <DiffTag level={s.task.difficulty} />
                  <span
                    className="font-mono font-medium"
                    style={{ fontSize: 13, color: scoreColor(s.total_score) }}
                  >
                    {s.total_score ?? '—'}
                  </span>
                  <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
                    {STATUS_LABELS[s.status]}
                  </span>
                </Link>
              );
            })}
          </div>

          {!loading && !error && total > 0 && (
            <Pagination
              page={page}
              total={total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="sessions"
              className="mt-4"
            />
          )}
        </div>
      </div>
    </div>
  );
}
