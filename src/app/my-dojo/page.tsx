'use client';

import NavBar from '@/components/NavBar';
import { CategoryTag, DiffTag } from '@/components/Tags';
import ProgressBar from '@/components/ProgressBar';
import Sparkline from '@/components/Sparkline';
import { HISTORY } from '@/lib/data';

const ACTIVITY_DATA = Array.from({ length: 84 }).map((_, index) => {
  const value = (index * 37 + 11) % 100;
  return value < 40 ? 0 : value < 60 ? 1 : value < 85 ? 2 : 3;
});

export default function MyDojoPage() {
  const intensityColors = [
    'var(--color-bg-3)',
    'oklch(0.86 0.20 130 / 0.3)',
    'oklch(0.86 0.20 130 / 0.55)',
    'var(--color-acc)',
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-0 text-text-1">
      <NavBar />
      <div className="flex-1 overflow-y-auto custom-scroll">
        <div className="max-w-[1100px] mx-auto" style={{ padding: '32px 36px' }}>
          <div
            className="font-mono text-text-3 mb-1"
            style={{ fontSize: 11, letterSpacing: '0.08em' }}
          >
            kim.dev · joined 2026-03
          </div>
          <h1 className="font-medium mb-7" style={{ fontSize: 26 }}>
            My Dojo
          </h1>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-2.5 mb-7">
            {(
              [
                ['avg score', '79.0', 'var(--color-acc)', [70, 65, 72, 78, 81, 79, 87]],
                ['solved', '14', null, [1, 1, 2, 2, 3, 3, 4]],
                ['streak', '4 days', null, null],
                ['total tokens', '38.2k', null, null],
                ['rank', 'Brown · 312', null, null],
              ] as [string, string, string | null, number[] | null][]
            ).map(([l, v, c, spark]) => (
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
                {spark && (
                  <div className="mt-2">
                    <Sparkline data={spark} color={c || 'var(--color-text-3)'} w={100} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid gap-7" style={{ gridTemplateColumns: '1fr 280px' }}>
            {/* History */}
            <div>
              <div className="flex justify-between items-baseline mb-3.5">
                <div
                  className="font-mono text-text-3"
                  style={{ fontSize: 11, letterSpacing: '0.08em' }}
                >
                  ─── HISTORY · LAST 7 SESSIONS
                </div>
                <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
                  view all →
                </span>
              </div>
              <div className="bg-bg-1 border border-line rounded-[10px] overflow-hidden">
                <div
                  className="grid gap-3 border-b border-line bg-bg-1"
                  style={{
                    gridTemplateColumns: '60px 1fr 100px 80px 60px 60px 60px',
                    padding: '8px 16px',
                  }}
                >
                  {['DATE', 'TASK', 'CATEGORY', 'DIFF', 'SCORE', 'TRIES', 'TIME'].map((h) => (
                    <div
                      key={h}
                      className="font-mono text-text-3"
                      style={{ fontSize: 9.5, letterSpacing: '0.06em' }}
                    >
                      {h}
                    </div>
                  ))}
                </div>
                {HISTORY.map((h, i) => (
                  <div
                    key={i}
                    className="grid gap-3 items-center"
                    style={{
                      gridTemplateColumns: '60px 1fr 100px 80px 60px 60px 60px',
                      padding: '12px 16px',
                      borderBottom: i < HISTORY.length - 1 ? '1px solid var(--color-line)' : 'none',
                      opacity: 'abandoned' in h && h.abandoned ? 0.45 : 1,
                    }}
                  >
                    <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
                      {h.date}
                    </span>
                    <span style={{ fontSize: 13 }}>
                      {'abandoned' in h && h.abandoned && (
                        <span className="font-mono text-err mr-1.5" style={{ fontSize: 10 }}>
                          abandoned
                        </span>
                      )}
                      {h.task}
                    </span>
                    <CategoryTag cat={h.cat} />
                    <DiffTag level={h.diff} />
                    <span
                      className="font-mono font-medium"
                      style={{
                        fontSize: 13,
                        color:
                          h.score == null
                            ? 'var(--color-text-4)'
                            : h.score >= 80
                              ? 'var(--color-acc)'
                              : h.score >= 60
                                ? 'var(--color-warn)'
                                : 'var(--color-err)',
                      }}
                    >
                      {h.score ?? '—'}
                    </span>
                    <span className="font-mono text-text-3" style={{ fontSize: 11.5 }}>
                      {h.attempts}
                    </span>
                    <span className="font-mono text-text-3" style={{ fontSize: 11.5 }}>
                      {h.time}
                    </span>
                  </div>
                ))}
              </div>

              {/* Skill breakdown */}
              <div
                className="font-mono text-text-3 mt-7 mb-3.5"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                ─── SKILL BREAKDOWN
              </div>
              <div className="bg-bg-1 border border-line rounded-[10px] p-4.5">
                <div className="flex flex-col gap-2.5">
                  {[
                    ['프롬프트 명확성', 8.6],
                    ['컨텍스트 활용', 7.9],
                    ['에러 복구', 8.2],
                    ['토큰 효율', 6.4],
                    ['시도 효율', 7.8],
                  ].map(([l, v]) => (
                    <div
                      key={l as string}
                      className="grid gap-3.5 items-center"
                      style={{ gridTemplateColumns: '160px 1fr 50px' }}
                    >
                      <span className="text-text-2" style={{ fontSize: 12.5 }}>
                        {l as string}
                      </span>
                      <ProgressBar
                        value={(v as number) * 10}
                        color={(v as number) >= 8 ? 'var(--color-acc)' : 'var(--color-warn)'}
                        height={5}
                      />
                      <span className="font-mono text-right" style={{ fontSize: 12 }}>
                        {(v as number).toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Aside */}
            <div>
              <div
                className="font-mono text-text-3 mb-3.5"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                ─── ACTIVITY · 12 WEEKS
              </div>
              <div className="bg-bg-1 border border-line rounded-[10px] p-3.5 mb-5">
                <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
                  {ACTIVITY_DATA.map((intensity, i) => (
                    <div
                      key={i}
                      className="rounded-[2px]"
                      style={{ aspectRatio: '1', background: intensityColors[intensity] }}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-mono text-text-3" style={{ fontSize: 10 }}>
                    less
                  </span>
                  <div className="flex gap-0.5">
                    {intensityColors.map((c, i) => (
                      <div
                        key={i}
                        className="rounded-[2px]"
                        style={{ width: 9, height: 9, background: c }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-text-3" style={{ fontSize: 10 }}>
                    more
                  </span>
                </div>
              </div>

              <div
                className="font-mono text-text-3 mb-3.5"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                ─── BADGES
              </div>
              <div className="bg-bg-1 border border-line rounded-[10px] p-3.5">
                {[
                  ['🥋', 'First Submission', '04-23'],
                  ['⚡', 'Sub-5min Solver', '04-23'],
                  ['🎯', 'No Retry Hero', '04-25'],
                  ['🔒', 'Streak 7d', 'locked'],
                ].map(([ic, name, date], i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3"
                    style={{
                      padding: '8px 0',
                      borderBottom: i < 3 ? '1px solid var(--color-line)' : 'none',
                      opacity: date === 'locked' ? 0.4 : 1,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{ic}</span>
                    <div className="flex-1">
                      <div style={{ fontSize: 12.5 }}>{name}</div>
                      <div className="font-mono text-text-3" style={{ fontSize: 10 }}>
                        {date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
