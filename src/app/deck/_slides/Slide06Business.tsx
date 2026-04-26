'use client';

import { useEffect, useState } from 'react';
import { SlideShell } from './SlideShell';

export function Slide06Business({ index, total }: { index: number; total: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <SlideShell index={index} total={total} eyebrow="05 · BUSINESS">
      <div
        className="absolute inset-0 flex flex-col justify-center"
        style={{ padding: '60px 80px' }}
      >
        <div
          className="font-mono text-text-3 mb-4"
          style={{ fontSize: 12, letterSpacing: '0.12em' }}
        >
          ─── GO TO MARKET
        </div>
        <h2
          className="font-medium"
          style={{ fontSize: 46, lineHeight: 1.15, letterSpacing: '-0.02em' }}
        >
          개인이 시작하고, <span className="text-acc">팀이 결제</span>합니다.
        </h2>

        <div className="grid grid-cols-3 mt-10" style={{ gap: 16 }}>
          {[
            {
              tag: 'B2C · FREE → PRO',
              title: '$9 / mo',
              desc: '개발자 개인 — 무제한 quest, 풀이 히스토리, 백분위 비교',
              note: '획득 채널: GitHub OAuth, 개발자 커뮤니티',
            },
            {
              tag: 'B2B · TEAM',
              title: '$29 / seat',
              desc: '채용 스크리닝 · 팀 AI 역량 리포트 · 사내 리더보드',
              note: '대상: 30~150인 mid-market 기술 조직',
              highlight: true,
            },
            {
              tag: 'B2B · ENTERPRISE',
              title: 'Custom',
              desc: '채용 평가 통합, SSO, 자체 호스팅, 데이터 잔류 옵션',
              note: '판매 사이클: 6~12주, 디자인 파트너 우선',
            },
          ].map((p, i) => (
            <div
              key={p.tag}
              className="border rounded-[12px] transition-all duration-500"
              style={{
                padding: 24,
                borderColor: p.highlight ? 'var(--color-acc-line)' : 'var(--color-line)',
                background: p.highlight ? 'oklch(0.86 0.2 130 / 0.05)' : 'var(--color-bg-1)',
                opacity: show ? 1 : 0,
                transform: show ? 'translateY(0)' : 'translateY(10px)',
                transitionDelay: `${i * 120}ms`,
              }}
            >
              <div
                className="font-mono mb-3"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  color: p.highlight ? 'var(--color-acc)' : 'var(--color-text-3)',
                }}
              >
                {p.tag}
              </div>
              <div className="font-semibold" style={{ fontSize: 32, letterSpacing: '-0.02em' }}>
                {p.title}
              </div>
              <div className="text-text-2 mt-3" style={{ fontSize: 14, lineHeight: 1.55 }}>
                {p.desc}
              </div>
              <div
                className="font-mono text-text-3 mt-4 pt-4 border-t border-line"
                style={{ fontSize: 11, letterSpacing: '0.04em' }}
              >
                {p.note}
              </div>
            </div>
          ))}
        </div>

        <div
          className="grid grid-cols-3 mt-8 transition-opacity duration-500"
          style={{ gap: 16, opacity: show ? 1 : 0, transitionDelay: '500ms' }}
        >
          {[
            ['UNIT API COST', '~$0.04 / submit', '풀이 에이전트 + Judge ×3 채점 에이전트'],
            ['AVG MAU COST', '~$1.20 / mo', '월 30 submits 가정 · API 비용 매출의 ~13%'],
            ['MOAT', 'Quest 데이터셋', '풀이·점수 누적 → 채용 신호로 환산'],
          ].map(([k, v, d]) => (
            <div key={k} className="flex flex-col">
              <span
                className="font-mono text-text-3"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                {k}
              </span>
              <span
                className="font-mono font-semibold text-acc mt-1"
                style={{ fontSize: 22, letterSpacing: '-0.02em' }}
              >
                {v}
              </span>
              <span className="text-text-3 mt-1" style={{ fontSize: 12, lineHeight: 1.4 }}>
                {d}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}
