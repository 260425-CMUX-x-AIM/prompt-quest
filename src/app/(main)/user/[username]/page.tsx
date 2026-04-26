'use client';

import { use, useEffect, useMemo, useState } from 'react';
import NavBar from '@/components/NavBar';
import Pagination from '@/components/Pagination';
import Sparkline from '@/components/Sparkline';
import { CategoryTag, DiffTag } from '@/components/Tags';
import { getErrorMessage } from '@/lib/api/errors';
import type {
  ApiError,
  MeSessionsItem,
  PublicProfile,
  UserSessionsResponse,
} from '@/lib/api/contracts';
import {
  ACTIVITY_COLORS,
  buildActivitySummary,
  buildBadges,
  computeStreak,
  formatShortDate,
  scoreColor,
} from '@/lib/profile-stats';

const PAGE_SIZE = 10;
const ACTIVITY_LIMIT = 100;

export default function PublicUserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [page, setPage] = useState(1);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [sessions, setSessions] = useState<MeSessionsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<MeSessionsItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const search = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      status: 'evaluated',
    });

    fetch(`/api/users/${username}/sessions?${search}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as ApiError | null;
          setError(getErrorMessage(data?.error?.code));
          setProfile(null);
          setSessions([]);
          setTotal(0);
          return;
        }

        const data = (await res.json()) as UserSessionsResponse;
        setError(null);
        setProfile(data.profile);
        setSessions(data.sessions);
        setTotal(data.total);
      })
      .catch(() => {
        if (!cancelled) {
          setError('공개 프로필을 불러올 수 없습니다.');
          setProfile(null);
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
  }, [page, username]);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/users/${username}/sessions?page=1&limit=${ACTIVITY_LIMIT}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as ApiError | null;
          setError(getErrorMessage(data?.error?.code));
          setRecentSessions([]);
          return;
        }
        const data = (await res.json()) as UserSessionsResponse;
        setProfile(data.profile);
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
  }, [username]);

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

  const title = profile?.display_name || `@${username}`;
  const meta = profile?.display_name ? `@${profile.username}` : 'PUBLIC PROFILE';

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-0 text-text-1">
      <NavBar />
      <div className="custom-scroll flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1100px]" style={{ padding: '32px 36px 40px' }}>
          <div
            className="mb-2 font-mono text-text-3"
            style={{ fontSize: 11, letterSpacing: '0.08em' }}
          >
            {meta}
          </div>
          <h1 className="mb-7 font-medium" style={{ fontSize: 26 }}>
            {title}
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
              <div
                className="mb-3 font-mono text-text-3"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                COMPLETED HISTORY · {total} SESSIONS
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

                {!loading && sessions.length === 0 && !error && (
                  <div className="p-5 text-text-3" style={{ fontSize: 12 }}>
                    아직 공개할 세션이 없습니다.
                  </div>
                )}

                {sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="grid items-center gap-3 border-b border-line"
                    style={{
                      gridTemplateColumns: '60px 1fr 110px 80px 70px 80px',
                      padding: '12px 16px',
                      borderBottom:
                        index < sessions.length - 1 ? '1px solid var(--color-line)' : 'none',
                      opacity: session.status === 'abandoned' ? 0.45 : 1,
                    }}
                  >
                    <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
                      {formatShortDate(session.started_at)}
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
                      완료
                    </span>
                  </div>
                ))}
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
                          {badge.achievedAt ? formatShortDate(badge.achievedAt) : 'locked'}
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
