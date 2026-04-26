'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Pagination from '@/components/Pagination';
import Sparkline from '@/components/Sparkline';
import { CategoryTag, DiffTag } from '@/components/Tags';
import { getErrorMessage } from '@/lib/api/errors';
import type { ApiError, MeSessionsItem, MeSessionsResponse } from '@/lib/api/contracts';
import type { SessionStatus } from '@/lib/types/session';

const PAGE_SIZE = 10;
const ACTIVITY_LIMIT = 100;
const ACTIVITY_COLORS = [
  'var(--color-bg-3)',
  'oklch(0.86 0.2 130 / 0.3)',
  'oklch(0.86 0.2 130 / 0.55)',
  'var(--color-acc)',
] as const;

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

type BadgeItem = {
  code: string;
  title: string;
  achievedAt: string | null;
};

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

function dateKeyFromDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dateKeyFromIso(iso: string) {
  return dateKeyFromDate(new Date(iso));
}

function subtractDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() - days);
  return next;
}

function computeStreak(sessions: MeSessionsItem[]) {
  const activeDates = new Set(
    sessions
      .filter((session) => session.status !== 'abandoned')
      .map((session) => dateKeyFromIso(session.started_at)),
  );
  if (activeDates.size === 0) return 0;

  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!activeDates.has(dateKeyFromDate(cursor))) {
    cursor = subtractDays(cursor, 1);
  }

  let streak = 0;
  while (activeDates.has(dateKeyFromDate(cursor))) {
    streak += 1;
    cursor = subtractDays(cursor, 1);
  }

  return streak;
}

function buildActivitySummary(sessions: MeSessionsItem[]) {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    if (session.status === 'abandoned') continue;
    const key = dateKeyFromIso(session.started_at);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = subtractDays(today, 83);

  const rawCells = Array.from({ length: 84 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = dateKeyFromDate(date);
    return {
      key,
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      count: counts.get(key) ?? 0,
    };
  });

  const maxCount = rawCells.reduce((max, cell) => Math.max(max, cell.count), 0);
  const cells = rawCells.map((cell) => {
    if (cell.count === 0) return { ...cell, intensity: 0 as const };
    if (maxCount <= 1) return { ...cell, intensity: 3 as const };
    const ratio = cell.count / maxCount;
    if (ratio < 0.34) return { ...cell, intensity: 1 as const };
    if (ratio < 0.67) return { ...cell, intensity: 2 as const };
    return { ...cell, intensity: 3 as const };
  });

  return {
    cells,
    activeDays: cells.filter((cell) => cell.count > 0).length,
  };
}

function buildBadges(sessions: MeSessionsItem[], streak: number, activeDays: number): BadgeItem[] {
  const ordered = [...sessions].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
  );
  const evaluated = ordered.filter((session) => session.status === 'evaluated');

  const firstClear = evaluated[0];
  const noRetryHero = evaluated.find(
    (session) => session.attempt_count === 1 && (session.total_score ?? 0) >= 80,
  );
  const hardSolver = evaluated.find(
    (session) => session.task.difficulty === 'hard' && (session.total_score ?? 0) >= 80,
  );
  const activeTenDays =
    activeDays >= 10 ? ordered.find((session) => session.status !== 'abandoned') : null;

  return [
    { code: '01', title: 'First Clear', achievedAt: firstClear?.started_at ?? null },
    { code: '02', title: 'No Retry Hero', achievedAt: noRetryHero?.started_at ?? null },
    { code: '03', title: 'Streak 7d', achievedAt: streak >= 7 ? new Date().toISOString() : null },
    { code: '04', title: 'Hard Solver', achievedAt: hardSolver?.started_at ?? null },
    { code: '05', title: 'Active 10d', achievedAt: activeTenDays?.started_at ?? null },
  ];
}

export default function MyPage() {
  const [filter, setFilter] = useState<'all' | SessionStatus>('all');
  const [page, setPage] = useState(1);
  const [sessions, setSessions] = useState<MeSessionsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<MeSessionsItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (filter !== 'all') params.set('status', filter);

    fetch(`/api/me/sessions?${params}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as ApiError | null;
          setError(getErrorMessage(data?.error?.code));
          setSessions([]);
          setTotal(0);
          return;
        }

        const data = (await res.json()) as MeSessionsResponse;
        setError(null);
        setSessions(data.sessions);
        setTotal(data.total);
      })
      .catch(() => {
        if (!cancelled) {
          setError('세션 목록을 불러올 수 없습니다.');
          setSessions([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filter, page]);

  useEffect(() => {
    let cancelled = false;
    setActivityLoading(true);

    fetch(`/api/me/sessions?page=1&limit=${ACTIVITY_LIMIT}`)
      .then(async (res) => {
        if (cancelled || !res.ok) return;
        const data = (await res.json()) as MeSessionsResponse;
        setRecentSessions(data.sessions);
      })
      .catch(() => {
        if (!cancelled) setRecentSessions([]);
      })
      .finally(() => {
        if (!cancelled) setActivityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activitySummary = useMemo(() => buildActivitySummary(recentSessions), [recentSessions]);
  const streak = useMemo(() => computeStreak(recentSessions), [recentSessions]);
  const badges = useMemo(
    () => buildBadges(recentSessions, streak, activitySummary.activeDays),
    [activitySummary.activeDays, recentSessions, streak],
  );

  const scoredSessions = recentSessions.filter((session) => session.total_score != null);
  const avgScore = scoredSessions.length
    ? (
        scoredSessions.reduce((sum, session) => sum + (session.total_score ?? 0), 0) /
        scoredSessions.length
      ).toFixed(1)
    : null;
  const solvedCount = recentSessions.filter((session) => session.status === 'evaluated').length;
  const totalTokens = recentSessions.reduce(
    (sum, session) => sum + session.total_input_tokens + session.total_output_tokens,
    0,
  );
  const bestScore = scoredSessions.length
    ? Math.max(...scoredSessions.map((session) => session.total_score ?? 0))
    : null;
  const scoreTrend = scoredSessions
    .slice(0, 7)
    .reverse()
    .map((session) => session.total_score ?? 0);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-0 text-text-1">
      <NavBar />
      <div className="custom-scroll flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1100px]" style={{ padding: '32px 36px 40px' }}>
          <h1 className="mb-7 font-medium" style={{ fontSize: 26 }}>
            My
          </h1>

          <div className="mb-7 grid gap-2.5 md:grid-cols-3 xl:grid-cols-5">
            {[
              {
                label: 'avg score',
                value: activityLoading ? '—' : (avgScore ?? '—'),
                color: 'var(--color-acc)',
                spark: scoreTrend.length > 1 ? scoreTrend : null,
              },
              {
                label: 'solved',
                value: activityLoading ? '—' : String(solvedCount),
                color: null,
                spark: null,
              },
              {
                label: 'streak',
                value: activityLoading ? '—' : `${streak} days`,
                color: null,
                spark: null,
              },
              {
                label: 'total tokens',
                value: activityLoading ? '—' : totalTokens.toLocaleString(),
                color: null,
                spark: null,
              },
              {
                label: 'best score',
                value: activityLoading ? '—' : (bestScore?.toString() ?? '—'),
                color: null,
                spark: null,
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[10px] border border-line bg-bg-1 p-4">
                <div
                  className="mb-1.5 font-mono uppercase text-text-3"
                  style={{ fontSize: 10, letterSpacing: '0.06em' }}
                >
                  {stat.label}
                </div>
                <div
                  className="font-mono font-medium"
                  style={{ fontSize: 22, color: stat.color ?? 'var(--color-text-1)' }}
                >
                  {stat.value}
                </div>
                {stat.spark && (
                  <div className="mt-2">
                    <Sparkline
                      data={stat.spark}
                      color={stat.color ?? 'var(--color-text-3)'}
                      w={100}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <div className="mb-3.5 flex flex-wrap gap-2">
                {STATUS_FILTERS.map((statusFilter) => (
                  <button
                    key={statusFilter.value}
                    type="button"
                    onClick={() => {
                      setFilter(statusFilter.value);
                      setPage(1);
                    }}
                    className="rounded font-mono"
                    style={{
                      padding: '5px 10px',
                      fontSize: 11.5,
                      letterSpacing: '0.04em',
                      color:
                        filter === statusFilter.value
                          ? 'var(--color-text-1)'
                          : 'var(--color-text-3)',
                      background:
                        filter === statusFilter.value ? 'var(--color-bg-2)' : 'transparent',
                      border: '1px solid var(--color-line)',
                    }}
                  >
                    {statusFilter.label}
                  </button>
                ))}
              </div>

              <div
                className="mb-3 font-mono text-text-3"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                HISTORY · {total} SESSIONS
              </div>

              {error && (
                <div className="mb-3 font-mono text-err" style={{ fontSize: 12 }}>
                  {error}
                </div>
              )}

              <div className="overflow-hidden rounded-[10px] border border-line bg-bg-1">
                <div
                  className="grid gap-3 border-b border-line bg-bg-1"
                  style={{
                    gridTemplateColumns: '60px 1fr 110px 80px 70px 80px',
                    padding: '8px 16px',
                  }}
                >
                  {['DATE', 'TASK', 'CATEGORY', 'DIFF', 'SCORE', 'STATUS'].map((header) => (
                    <div
                      key={header}
                      className="font-mono text-text-3"
                      style={{ fontSize: 9.5, letterSpacing: '0.06em' }}
                    >
                      {header}
                    </div>
                  ))}
                </div>

                {loading && (
                  <div className="p-5 text-text-3" style={{ fontSize: 12 }}>
                    불러오는 중…
                  </div>
                )}

                {!loading && sessions.length === 0 && (
                  <div className="p-5 text-text-3" style={{ fontSize: 12 }}>
                    아직 도전한 태스크가 없습니다.{' '}
                    <Link href="/tasks" className="underline">
                      태스크 목록 →
                    </Link>
                  </div>
                )}

                {sessions.map((session, index) => {
                  const target =
                    session.status === 'in_progress'
                      ? `/challenge/${session.id}`
                      : `/results/${session.id}`;

                  return (
                    <Link
                      key={session.id}
                      href={target}
                      className="grid items-center gap-3 border-b border-line hover:bg-bg-2"
                      style={{
                        gridTemplateColumns: '60px 1fr 110px 80px 70px 80px',
                        padding: '12px 16px',
                        borderBottom:
                          index < sessions.length - 1 ? '1px solid var(--color-line)' : 'none',
                        opacity: session.status === 'abandoned' ? 0.45 : 1,
                      }}
                    >
                      <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
                        {formatDate(session.started_at)}
                      </span>
                      <span style={{ fontSize: 13 }}>{session.task.title}</span>
                      <CategoryTag cat={session.task.category} />
                      <DiffTag level={session.task.difficulty} />
                      <span
                        className="font-mono font-medium"
                        style={{ fontSize: 13, color: scoreColor(session.total_score) }}
                      >
                        {session.total_score ?? '—'}
                      </span>
                      <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
                        {STATUS_LABELS[session.status]}
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

            <div>
              <div
                className="mb-3.5 font-mono text-text-3"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                ACTIVITY · 12 WEEKS
              </div>
              <div className="mb-5 rounded-[10px] border border-line bg-bg-1 p-3.5">
                {activityLoading ? (
                  <div className="py-6 text-center text-text-3" style={{ fontSize: 12 }}>
                    활동을 불러오는 중…
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: 'grid',
                        gridAutoFlow: 'column',
                        gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
                        gridAutoColumns: '1fr',
                        gap: 3,
                      }}
                    >
                      {activitySummary.cells.map((cell) => (
                        <div
                          key={cell.key}
                          title={`${cell.label} · ${cell.count} session`}
                          className="rounded-[2px]"
                          style={{
                            aspectRatio: '1 / 1',
                            background: ACTIVITY_COLORS[cell.intensity],
                          }}
                        />
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono text-text-3" style={{ fontSize: 10 }}>
                        {activitySummary.activeDays} active days
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-text-3" style={{ fontSize: 10 }}>
                          less
                        </span>
                        {ACTIVITY_COLORS.map((color) => (
                          <div
                            key={color}
                            className="h-[9px] w-[9px] rounded-[2px]"
                            style={{ background: color }}
                          />
                        ))}
                        <span className="font-mono text-text-3" style={{ fontSize: 10 }}>
                          more
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div
                className="mb-3.5 font-mono text-text-3"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                BADGES
              </div>
              <div className="rounded-[10px] border border-line bg-bg-1 p-3.5">
                {badges.map((badge, index) => {
                  const locked = badge.achievedAt == null;
                  return (
                    <div
                      key={badge.code}
                      className="flex items-center gap-3 py-2"
                      style={{
                        borderBottom:
                          index < badges.length - 1 ? '1px solid var(--color-line)' : 'none',
                        opacity: locked ? 0.45 : 1,
                      }}
                    >
                      <div
                        className="grid h-9 w-9 place-items-center rounded-md border font-mono"
                        style={{
                          fontSize: 11,
                          borderColor: locked ? 'var(--color-line)' : 'var(--color-acc-line)',
                          background: locked ? 'var(--color-bg-2)' : 'var(--color-acc-dim)',
                          color: locked ? 'var(--color-text-3)' : 'var(--color-acc)',
                        }}
                      >
                        {badge.code}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div style={{ fontSize: 12.5 }}>{badge.title}</div>
                        <div className="font-mono text-text-3" style={{ fontSize: 10 }}>
                          {badge.achievedAt ? formatDate(badge.achievedAt) : 'locked'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
