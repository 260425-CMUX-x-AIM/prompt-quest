'use client';

import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Slide01Title } from './_slides/Slide01Title';
import { Slide02Problem } from './_slides/Slide02Problem';
import { Slide03Solution } from './_slides/Slide03Solution';
import { Slide04Demo } from './_slides/Slide04Demo';
import { Slide05Why } from './_slides/Slide05Why';
import { Slide06Business } from './_slides/Slide06Business';
import { Slide07Vision } from './_slides/Slide07Vision';
import { Slide08Closing } from './_slides/Slide08Closing';

const TOTAL = 8;

function DeckInner() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = Number(params.get('slide') ?? '1');
  const current = Math.min(Math.max(1, isNaN(raw) ? 1 : raw), TOTAL);

  const [showHelp, setShowHelp] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const goto = useCallback(
    (n: number) => {
      const next = Math.min(Math.max(1, n), TOTAL);
      const sp = new URLSearchParams(params.toString());
      sp.set('slide', String(next));
      router.replace(`/deck?${sp.toString()}`, { scroll: false });
    },
    [params, router],
  );

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      }
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          goto(current + 1);
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          goto(current - 1);
          break;
        case 'Home':
          e.preventDefault();
          goto(1);
          break;
        case 'End':
          e.preventDefault();
          goto(TOTAL);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case '?':
          setShowHelp((s) => !s);
          break;
        case 'Escape':
          setShowHelp(false);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, goto, toggleFullscreen]);

  // 16:9 scaling — fit viewport, keep aspect
  useLayoutEffect(() => {
    const fit = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const targetW = 1600;
      const targetH = 900;
      const s = Math.min(vw / targetW, vh / targetH);
      setScale(s);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const slides = [
    <Slide01Title key="1" index={1} total={TOTAL} />,
    <Slide02Problem key="2" index={2} total={TOTAL} />,
    <Slide03Solution key="3" index={3} total={TOTAL} />,
    <Slide04Demo key="4" index={4} total={TOTAL} />,
    <Slide05Why key="5" index={5} total={TOTAL} />,
    <Slide06Business key="6" index={6} total={TOTAL} />,
    <Slide07Vision key="7" index={7} total={TOTAL} />,
    <Slide08Closing key="8" index={8} total={TOTAL} />,
  ];

  return (
    <div className="fixed inset-0 bg-bg-0 text-text-1 overflow-hidden flex items-center justify-center select-none">
      {/* Click zones */}
      <button
        onClick={() => goto(current - 1)}
        aria-label="Previous slide"
        className="absolute left-0 top-0 bottom-0 z-30 cursor-w-resize"
        style={{ width: '20%', background: 'transparent' }}
      />
      <button
        onClick={() => goto(current + 1)}
        aria-label="Next slide"
        className="absolute right-0 top-0 bottom-0 z-30 cursor-e-resize"
        style={{ width: '20%', background: 'transparent' }}
      />

      <div
        ref={stageRef}
        style={{
          width: 1600,
          height: 900,
          transform: `scale(${scale})`,
          transformOrigin: 'center',
          position: 'relative',
          wordBreak: 'keep-all',
          overflowWrap: 'break-word',
        }}
      >
        <div
          className="absolute inset-0 overflow-hidden bg-bg-0"
          style={{
            border: isFullscreen ? 'none' : '1px solid var(--color-line)',
            borderRadius: isFullscreen ? 0 : 14,
          }}
          key={current}
        >
          {slides[current - 1]}
        </div>
      </div>

      {/* Bottom nav */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 z-40"
        style={{ bottom: 18 }}
      >
        <button
          onClick={() => goto(current - 1)}
          className="font-mono text-text-3 hover:text-text-1 transition-colors"
          style={{ fontSize: 12, padding: '6px 10px' }}
          aria-label="Previous"
        >
          ←
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL }).map((_, i) => {
            const n = i + 1;
            const active = n === current;
            return (
              <button
                key={n}
                onClick={() => goto(n)}
                aria-label={`Slide ${n}`}
                className="rounded-full transition-all"
                style={{
                  width: active ? 22 : 7,
                  height: 7,
                  background: active ? 'var(--color-acc)' : 'var(--color-bg-3)',
                }}
              />
            );
          })}
        </div>
        <button
          onClick={() => goto(current + 1)}
          className="font-mono text-text-3 hover:text-text-1 transition-colors"
          style={{ fontSize: 12, padding: '6px 10px' }}
          aria-label="Next"
        >
          →
        </button>
        <span
          className="font-mono text-text-4 ml-2"
          style={{ fontSize: 11, letterSpacing: '0.06em' }}
        >
          {String(current).padStart(2, '0')} / {String(TOTAL).padStart(2, '0')} · ?
        </span>
      </div>

      {/* Help overlay */}
      {showHelp && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-bg-1 border border-line rounded-[12px]"
            style={{ padding: 28, minWidth: 360 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="font-mono text-text-3 mb-4"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              ─── KEYBINDINGS
            </div>
            <div className="grid grid-cols-2" style={{ gap: '10px 24px' }}>
              {[
                ['→ / Space', 'Next'],
                ['←', 'Previous'],
                ['Home / End', 'First / Last'],
                ['F', 'Fullscreen'],
                ['?', 'Toggle help'],
                ['Esc', 'Close help'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="font-mono text-acc" style={{ fontSize: 12 }}>
                    {k}
                  </span>
                  <span className="text-text-2" style={{ fontSize: 12 }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DeckPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-bg-0" />}>
      <DeckInner />
    </Suspense>
  );
}
