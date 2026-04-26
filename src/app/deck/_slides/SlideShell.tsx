'use client';

import { ReactNode } from 'react';

export function SlideShell({
  eyebrow,
  index,
  total,
  children,
}: {
  eyebrow?: string;
  index: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <div className="absolute inset-0 flex flex-col">
      <div
        className="flex items-center justify-between border-b border-line"
        style={{ padding: '20px 48px' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-[7px] h-[7px] rounded-full bg-acc"
            style={{ boxShadow: '0 0 0 3px oklch(0.86 0.2 130 / 0.25)' }}
          />
          <span className="font-mono text-text-3" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
            PROMPTQUEST · PITCH
          </span>
          {eyebrow && (
            <>
              <span className="text-text-4 font-mono" style={{ fontSize: 11 }}>
                /
              </span>
              <span
                className="font-mono text-text-2"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                {eyebrow}
              </span>
            </>
          )}
        </div>
        <span className="font-mono text-text-3" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
          {String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>
      <div className="flex-1 relative overflow-hidden">{children}</div>
    </div>
  );
}
