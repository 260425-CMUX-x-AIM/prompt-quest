'use client';

import { use, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { CategoryTag, DiffTag } from '@/components/Tags';
import ProgressBar from '@/components/ProgressBar';
import { ALL_TASKS, SAMPLE_MESSAGES, type ChatMessage } from '@/lib/data';

function highlightJs(s: string) {
  return s
    .replace(/(\/\/[^\n]*)/g, '<span style="color:var(--color-text-3);font-style:italic">$1</span>')
    .replace(
      /\b(const|let|var|function|return|if|else|new|class)\b/g,
      '<span style="color:oklch(0.78 0.12 280)">$1</span>',
    )
    .replace(
      /(\/[^/\n]+\/[gimsuy]*)/g,
      '<span style="color:oklch(0.84 0.14 80)">$1</span>',
    );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div
      className="flex gap-3 border-b border-line"
      style={{ padding: '14px 18px', background: isUser ? 'transparent' : 'var(--color-bg-1)' }}
    >
      <div
        className="grid place-items-center rounded shrink-0 font-mono font-semibold"
        style={{
          width: 22,
          height: 22,
          background: isUser ? 'var(--color-bg-3)' : 'var(--color-acc-dim)',
          color: isUser ? 'var(--color-text-2)' : 'var(--color-acc)',
          fontSize: 10,
        }}
      >
        {isUser ? 'You' : 'AI'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1.5">
          <span
            className="font-mono text-text-3"
            style={{ fontSize: 10, letterSpacing: '0.04em' }}
          >
            {isUser ? 'kim.dev' : 'claude-sonnet-4-5'}
          </span>
          <span className="font-mono text-text-4" style={{ fontSize: 10 }}>
            · {msg.tokens} tok
          </span>
        </div>
        <div className="whitespace-pre-wrap" style={{ fontSize: 13, lineHeight: 1.6 }}>
          {msg.content}
        </div>
        {msg.code && (
          <div className="mt-2.5 border border-line-2 rounded-md overflow-hidden">
            <div
              className="flex items-center justify-between border-b border-line-2 bg-bg-2"
              style={{ padding: '6px 10px' }}
            >
              <span className="font-mono text-text-3" style={{ fontSize: 10.5 }}>
                {msg.code.lang}
              </span>
              <div className="flex gap-1">
                <button
                  className="font-mono rounded border border-line text-text-1 bg-transparent hover:bg-bg-2 cursor-pointer"
                  style={{ fontSize: 11, padding: '3px 8px' }}
                >
                  Copy
                </button>
                <button
                  className="font-mono rounded border border-acc bg-acc text-acc-ink cursor-pointer"
                  style={{ fontSize: 11, padding: '3px 8px' }}
                >
                  + 결과물에 추가
                </button>
              </div>
            </div>
            <div
              className="font-mono overflow-x-auto whitespace-pre"
              style={{
                padding: '12px 14px',
                fontSize: 12,
                lineHeight: 1.7,
                background: '#0a0c0f',
              }}
              dangerouslySetInnerHTML={{ __html: highlightJs(msg.code.content) }}
            />
          </div>
        )}
        {msg.explain && (
          <div
            className="text-text-2 mt-2.5"
            style={{ fontSize: 12.5, lineHeight: 1.55 }}
            dangerouslySetInnerHTML={{
              __html: msg.explain.replace(
                /`([^`]+)`/g,
                '<code class="font-mono" style="background:var(--color-bg-2);padding:1px 5px;border-radius:3px;font-size:11px;">$1</code>',
              ),
            }}
          />
        )}
      </div>
    </div>
  );
}

// Day 4 에서 sessionId 로 실제 세션을 페치하도록 재작성 예정.
// Day 3 단계는 라우트 정렬만 — 내부 mock 사용은 그대로.
export default function ChallengePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId: slug } = use(params);
  const router = useRouter();
  const t = ALL_TASKS.find((x) => x.slug === slug) || ALL_TASKS[0];
  const [input, setInput] = useState('');
  const [activeArtifact, setActiveArtifact] = useState('v2');
  const chatRef = useRef<HTMLDivElement>(null);
  const messages = SAMPLE_MESSAGES;

  // 세션 entry 가드 — sessionId 로 페치, 권한·상태 검증 후 부적합하면 redirect
  // (Day 5 에서 데이터를 실제 UI에 바인딩하도록 확장 예정)
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sessions/${slug}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          router.replace('/login');
          return;
        }
        if (!res.ok) {
          router.replace('/tasks');
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        // 제출된 세션 재진입 → 결과 페이지로 (검토 #4)
        if (data.session?.status && data.session.status !== 'in_progress') {
          router.replace(`/results/${slug}`);
        }
      })
      .catch(() => {
        if (!cancelled) router.replace('/tasks');
      });
    return () => {
      cancelled = true;
    };
  }, [slug, router]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const elapsed = '07:42';
  const tokens = 1234;
  const attempts = '0/5';

  const finalCode = `const EMAIL_REGEX = /\\b[A-Za-z0-9._%+\\-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\\.[A-Za-z]+\\b/g;

// Test
const text = "Contact: alice@example.com or bob@sub.test.org";
console.log(text.match(EMAIL_REGEX));
// → ["alice@example.com", "bob@sub.test.org"]`;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-0 text-text-1">
      {/* Slim header */}
      <div
        className="flex items-center justify-between shrink-0 border-b border-line bg-bg-0"
        style={{ padding: '8px 16px', height: 44 }}
      >
        <div className="flex items-center gap-3.5">
          <Logo size={12} />
          <div className="w-px bg-line-2" style={{ height: 16 }} />
          <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
            tasks /
          </span>
          <span className="font-mono" style={{ fontSize: 11.5 }}>
            {t.slug}
          </span>
          <DiffTag level={t.diff} />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3.5 font-mono" style={{ fontSize: 11.5 }}>
            <span className="text-text-3">
              ⏱ <span className="text-text-1">{elapsed}</span>
            </span>
            <span className="text-text-3">
              ⎔ <span className="text-text-1">{tokens.toLocaleString()}</span> tok
            </span>
            <span className="text-text-3">
              ↻ <span className="text-text-1">{attempts}</span>
            </span>
          </div>
          <button
            className="rounded border border-line text-text-1 bg-transparent hover:bg-bg-2 cursor-pointer"
            style={{ fontSize: 12, padding: '5px 10px' }}
          >
            ⏸ 일시정지
          </button>
          <button
            className="rounded border border-line text-err bg-transparent hover:bg-bg-2 cursor-pointer"
            style={{ fontSize: 12, padding: '5px 10px' }}
          >
            포기
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Task info */}
        <div
          className="shrink-0 border-r border-line overflow-y-auto custom-scroll"
          style={{ width: 260, padding: '20px 18px' }}
        >
          <div className="flex gap-1.5 mb-3">
            <CategoryTag cat={t.cat} />
          </div>
          <h2 className="font-medium mb-3.5" style={{ fontSize: 15, lineHeight: 1.3 }}>
            {t.title}
          </h2>

          <div
            className="font-mono text-text-3 mb-2"
            style={{ fontSize: 9.5, letterSpacing: '0.08em' }}
          >
            SCENARIO
          </div>
          <p className="text-text-2 mb-5.5" style={{ fontSize: 12, lineHeight: 1.55 }}>
            로그 텍스트에서 이메일만 추출하는 정규식을 AI와 함께 만드세요. ReDoS 안전성도 고려해야
            합니다.
          </p>

          <div
            className="font-mono text-text-3 mb-2.5"
            style={{ fontSize: 9.5, letterSpacing: '0.08em' }}
          >
            REQUIREMENTS <span className="text-text-4">(local check)</span>
          </div>
          <div className="flex flex-col gap-1.5 mb-5.5">
            {(
              [
                ['req-1', '유효한 이메일 형식 매칭', true],
                ['req-2', '도메인 dot 최소 1개', true],
                ['req-3', 'ReDoS 안전', null],
              ] as const
            ).map(([id, desc, status]) => (
              <div key={id} className="flex gap-2 items-start" style={{ padding: '6px 0' }}>
                <div
                  className="grid place-items-center rounded shrink-0 mt-0.5"
                  style={{
                    width: 14,
                    height: 14,
                    border: `1px solid ${status === true ? 'var(--color-acc)' : 'var(--color-line-2)'}`,
                    background: status === true ? 'var(--color-acc)' : 'transparent',
                    color: 'var(--color-acc-ink)',
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {status === true && '✓'}
                </div>
                <div className="flex-1">
                  <div className="font-mono text-text-3" style={{ fontSize: 9.5 }}>
                    {id}
                  </div>
                  <div style={{ fontSize: 11.5, lineHeight: 1.4 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="font-mono text-text-3 mb-2"
            style={{ fontSize: 9.5, letterSpacing: '0.08em' }}
          >
            EFFICIENCY
          </div>
          <div className="flex flex-col gap-2 mb-5.5">
            {(
              [
                ['tokens', `${tokens} / ~800`, tokens / 800, 'var(--color-warn)'],
                ['time', `${elapsed} / 04:00`, 1.92, 'var(--color-err)'],
                ['attempts', '0 / 2', 0, 'var(--color-acc)'],
              ] as [string, string, number, string][]
            ).map(([l, v, ratio, color]) => (
              <div key={l}>
                <div className="flex justify-between mb-0.5">
                  <span className="font-mono text-text-3" style={{ fontSize: 10 }}>
                    {l}
                  </span>
                  <span className="font-mono text-text-2" style={{ fontSize: 10 }}>
                    {v}
                  </span>
                </div>
                <ProgressBar value={Math.min(100, ratio * 50)} color={color} height={3} />
              </div>
            ))}
          </div>

          <button
            className="w-full flex items-center justify-center rounded border border-line text-text-1 bg-transparent hover:bg-bg-2 cursor-pointer"
            style={{ fontSize: 12, padding: '5px 10px' }}
          >
            💡 힌트 보기 <span className="text-text-4 ml-1">· -5pt</span>
          </button>
        </div>

        {/* CENTER: Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <div ref={chatRef} className="flex-1 overflow-y-auto custom-scroll">
            <div
              className="flex items-center justify-between border-b border-line bg-bg-0"
              style={{ padding: '10px 18px' }}
            >
              <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
                conversation · {messages.length} messages
              </span>
              <span className="font-mono text-text-4" style={{ fontSize: 10 }}>
                claude-sonnet-4-5
              </span>
            </div>
            {messages.map((m, i) => (
              <MessageBubble key={i} msg={m} />
            ))}
          </div>

          {/* Prompt input */}
          <div className="border-t border-line bg-bg-0" style={{ padding: 14 }}>
            <div className="flex gap-1 mb-2 font-mono" style={{ fontSize: 10, color: 'var(--color-text-3)' }}>
              <span className="text-acc">tip</span>
              <span>이전 응답을 참조하면 더 효율적이에요. (예: &quot;위 패턴에서…&quot;)</span>
            </div>
            <div className="border border-line-2 rounded-md bg-bg-1" style={{ padding: 10 }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="AI에게 프롬프트 입력... (⌘↵ 전송)"
                rows={3}
                className="w-full bg-transparent border-none outline-none text-text-1 resize-none"
                style={{ fontSize: 13, lineHeight: 1.5 }}
              />
              <div className="flex items-center justify-between pt-2 border-t border-line">
                <div className="font-mono text-text-3" style={{ fontSize: 10.5 }}>
                  ~{Math.max(1, Math.ceil(input.length / 3.5))} tok · 누적 {tokens}
                </div>
                <button
                  className="inline-flex items-center gap-2 bg-acc text-acc-ink font-medium rounded-md border border-acc cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontSize: 12, padding: '5px 10px' }}
                  disabled={!input.trim()}
                >
                  전송
                  <span
                    className="font-mono rounded"
                    style={{
                      fontSize: 10.5,
                      padding: '1px 5px',
                      background: 'rgba(0,0,0,0.15)',
                      border: '1px solid rgba(0,0,0,0.2)',
                      color: 'rgba(0,0,0,0.6)',
                    }}
                  >
                    ⌘↵
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Artifact */}
        <div className="shrink-0 border-l border-line flex flex-col" style={{ width: 380 }}>
          <div
            className="flex items-center justify-between border-b border-line"
            style={{ padding: '8px 14px' }}
          >
            <span
              className="font-mono text-text-3"
              style={{ fontSize: 11, letterSpacing: '0.04em' }}
            >
              ARTIFACT · workspace
            </span>
            <span
              className="inline-block w-[7px] h-[7px] rounded-full bg-acc"
              style={{ boxShadow: '0 0 0 3px oklch(0.86 0.2 130 / 0.25)' }}
            />
          </div>

          <div
            className="flex gap-1 border-b border-line overflow-x-auto custom-scroll"
            style={{ padding: '8px 10px' }}
          >
            {[
              { id: 'v1', label: 'v1', src: 'AI' },
              { id: 'v2', label: 'v2', src: 'edited' },
              { id: 'v3', label: 'v3', src: 'AI' },
            ].map((v) => (
              <div
                key={v.id}
                onClick={() => setActiveArtifact(v.id)}
                className="font-mono rounded cursor-pointer"
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  background:
                    activeArtifact === v.id ? 'var(--color-acc-dim)' : 'transparent',
                  color:
                    activeArtifact === v.id ? 'var(--color-acc)' : 'var(--color-text-3)',
                  border: `1px solid ${activeArtifact === v.id ? 'var(--color-acc-line)' : 'var(--color-line-2)'}`,
                }}
              >
                {v.label} <span style={{ opacity: 0.6, fontSize: 9 }}>·{v.src}</span>
              </div>
            ))}
            <button
              className="ml-auto font-mono rounded border border-line text-text-1 bg-transparent hover:bg-bg-2 cursor-pointer"
              style={{ fontSize: 11, padding: '3px 8px' }}
            >
              +
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll">
            <div className="flex min-h-full">
              <div
                className="font-mono text-right select-none border-r border-line bg-bg-0 shrink-0"
                style={{
                  padding: '14px 8px',
                  color: 'var(--color-text-4)',
                  fontSize: 11.5,
                  lineHeight: 1.7,
                }}
              >
                {finalCode.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <pre
                className="font-mono flex-1"
                style={{
                  padding: '14px 14px',
                  margin: 0,
                  fontSize: 11.5,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
                dangerouslySetInnerHTML={{ __html: highlightJs(finalCode) }}
              />
            </div>
          </div>

          <div className="border-t border-line flex flex-col gap-2" style={{ padding: 12 }}>
            <div className="flex gap-1.5">
              <button
                className="flex-1 flex items-center justify-center rounded border border-line text-text-1 bg-transparent hover:bg-bg-2 cursor-pointer"
                style={{ fontSize: 12, padding: '5px 10px' }}
              >
                💾 버전 저장
              </button>
              <button
                className="flex-1 flex items-center justify-center rounded border border-line text-text-1 bg-transparent hover:bg-bg-2 cursor-pointer"
                style={{ fontSize: 12, padding: '5px 10px' }}
              >
                🧪 로컬 테스트
              </button>
            </div>
            <button
              onClick={() => router.push(`/eval/${t.slug}`)}
              className="w-full flex items-center justify-center bg-acc text-acc-ink font-semibold rounded-md border border-acc cursor-pointer transition-[filter] hover:brightness-105"
              style={{ padding: 10, fontSize: 13 }}
            >
              최종 제출 → 채점 시작
            </button>
            <div
              className="font-mono text-text-3 text-center"
              style={{ fontSize: 9.5 }}
            >
              제출 시 시도 카운트 +1 · 환불 불가
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
