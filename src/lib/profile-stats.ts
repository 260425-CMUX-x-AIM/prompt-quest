import type { MeSessionsItem } from '@/lib/api/contracts';

export const ACTIVITY_COLORS = [
  'var(--color-bg-3)',
  'oklch(0.86 0.2 130 / 0.3)',
  'oklch(0.86 0.2 130 / 0.55)',
  'var(--color-acc)',
] as const;

export type BadgeItem = {
  code: string;
  title: string;
  achievedAt: string | null;
};

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

export function formatShortDate(iso: string) {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}/${day}`;
}

export function scoreColor(score: number | null) {
  if (score == null) return 'var(--color-text-4)';
  if (score >= 80) return 'var(--color-acc)';
  if (score >= 60) return 'var(--color-warn)';
  return 'var(--color-err)';
}

export function computeStreak(sessions: MeSessionsItem[]) {
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

export function buildActivitySummary(sessions: MeSessionsItem[]) {
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

export function buildBadges(
  sessions: MeSessionsItem[],
  streak: number,
  activeDays: number,
): BadgeItem[] {
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
