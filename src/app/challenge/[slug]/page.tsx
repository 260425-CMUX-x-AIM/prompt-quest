'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { getClientAiConfig } from '@/lib/ai-provider.client';
import { CategoryTag, DiffTag } from '@/components/Tags';
import ProgressBar from '@/components/ProgressBar';
import { extractCodeBlocks, getChallengeDefinition, stripCodeBlocks } from '@/lib/challenge';
import { savePendingEvaluation } from '@/lib/evaluation/storage';
import { ALL_TASKS } from '@/lib/data';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens: number;
  codeBlocks: { language: string; content: string }[];
}

interface ArtifactVersion {
  id: string;
  label: string;
  src: 'AI' | 'edited';
  content: string;
}

interface UsageSummary {
  inputTokens: number;
  outputTokens: number;
}

const AI_CONFIG = getClientAiConfig();

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.trim().length / 3.7));
}

function createMessage(
  role: ChatMessage['role'],
  content: string,
  tokens = estimateTokens(content),
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    tokens,
    codeBlocks: extractCodeBlocks(content),
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function highlightJs(source: string) {
  return escapeHtml(source)
    .replace(/(\/\/[^\n]*)/g, '<span style="color:var(--color-text-3);font-style:italic">$1</span>')
    .replace(
      /\b(const|let|var|function|return|if|else|new|class|await|async|try|catch)\b/g,
      '<span style="color:oklch(0.78 0.12 280)">$1</span>',
    )
    .replace(
      /(&quot;[^&]*&quot;|&#39;[^&]*&#39;)/g,
      '<span style="color:oklch(0.85 0.10 200)">$1</span>',
    )
    .replace(/(\/[^/\n]+\/[gimsuy]*)/g, '<span style="color:oklch(0.84 0.14 80)">$1</span>');
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function MessageBubble({
  message,
  onUseArtifact,
}: {
  message: ChatMessage;
  onUseArtifact: (code: string) => void;
}) {
  const isUser = message.role === 'user';
  const textBody = stripCodeBlocks(message.content);

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
          <span className="font-mono text-text-3" style={{ fontSize: 10, letterSpacing: '0.04em' }}>
            {isUser ? 'kim.dev' : AI_CONFIG.modelLabel}
          </span>
          <span className="font-mono text-text-4" style={{ fontSize: 10 }}>
            · {message.tokens} tok
          </span>
        </div>
        {textBody ? (
          <div className="whitespace-pre-wrap" style={{ fontSize: 13, lineHeight: 1.6 }}>
            {textBody}
          </div>
        ) : null}
        {message.codeBlocks.map((block, index) => (
          <div
            key={`${message.id}-${index}`}
            className="mt-2.5 border border-line-2 rounded-md overflow-hidden"
          >
            <div
              className="flex items-center justify-between border-b border-line-2 bg-bg-2"
              style={{ padding: '6px 10px' }}
            >
              <span className="font-mono text-text-3" style={{ fontSize: 10.5 }}>
                {block.language}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => void navigator.clipboard.writeText(block.content)}
                  className="font-mono rounded border border-line text-text-1 bg-transparent hover:bg-bg-2 cursor-pointer"
                  style={{ fontSize: 11, padding: '3px 8px' }}
                >
                  Copy
                </button>
                {!isUser ? (
                  <button
                    onClick={() => onUseArtifact(block.content)}
                    className="font-mono rounded border border-acc bg-acc text-acc-ink cursor-pointer"
                    style={{ fontSize: 11, padding: '3px 8px' }}
                  >
                    + 결과물에 추가
                  </button>
                ) : null}
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
              dangerouslySetInnerHTML={{ __html: highlightJs(block.content) }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChallengePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const t = ALL_TASKS.find((x) => x.slug === slug) || ALL_TASKS[0];
  const challengeDef = getChallengeDefinition(t.slug);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage('assistant', '무엇을 도와드릴까요?'),
  ]);
  const [artifactVersions, setArtifactVersions] = useState<ArtifactVersion[]>([
    {
      id: 'v1',
      label: 'v1',
      src: 'edited',
      content: '',
    },
  ]);
  const [activeArtifact, setActiveArtifact] = useState('v1');
  const [usage, setUsage] = useState<UsageSummary>({ inputTokens: 0, outputTokens: 0 });
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSessionSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const currentArtifact =
    artifactVersions.find((version) => version.id === activeArtifact)?.content ||
    artifactVersions[0].content;

  const totalTokens = usage.inputTokens + usage.outputTokens;
  const elapsed = formatElapsed(sessionSeconds);
  const attemptCount = Math.max(
    1,
    artifactVersions.filter((version) => version.content.trim().length > 0).length,
  );
  const attempts = `${attemptCount}/${challengeDef.maxAttempts}`;
  const inputTokenRatio = totalTokens > 0 ? usage.inputTokens / totalTokens : 0;
  const outputTokenRatio = totalTokens > 0 ? usage.outputTokens / totalTokens : 0;

  function addArtifactVersion(content: string, src: ArtifactVersion['src']) {
    const nextId = `v${artifactVersions.length + 1}`;
    setArtifactVersions((current) => [
      ...current,
      {
        id: nextId,
        label: nextId,
        src,
        content,
      },
    ]);
    setActiveArtifact(nextId);
  }

  async function handleSendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = createMessage('user', trimmed);
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/challenge-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: t.slug,
          artifact: currentArtifact,
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const data = (await response.json()) as
        | { content: string; usage: UsageSummary }
        | { error: string };

      if (!response.ok || !('content' in data)) {
        throw new Error(
          'error' in data ? data.error : `${AI_CONFIG.displayName} 응답 처리에 실패했습니다.`,
        );
      }

      setMessages((current) => [
        ...current,
        createMessage('assistant', data.content, data.usage.outputTokens),
      ]);
      setUsage((current) => ({
        inputTokens: current.inputTokens + data.usage.inputTokens,
        outputTokens: current.outputTokens + data.usage.outputTokens,
      }));
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmitForEvaluation() {
    setSubmitError(null);

    if (!currentArtifact.trim()) {
      setSubmitError('최종 제출 전 결과물 패널에 산출물을 하나 이상 추가해 주세요.');
      return;
    }

    savePendingEvaluation({
      slug: t.slug,
      artifact: currentArtifact,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      usage,
      elapsedSeconds: sessionSeconds,
      attemptCount,
    });

    router.push(`/eval/${t.slug}`);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-0 text-text-1">
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
              ⎔ <span className="text-text-1">{totalTokens.toLocaleString()}</span> tok
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
            {challengeDef.scenario}
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
                ...challengeDef.requirements.map(
                  (item) => [item.id, item.description, null] as const,
                ),
                ['format', `결과물 형식: ${challengeDef.outputFormat}`, null] as const,
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
                [
                  'input tokens',
                  `+${usage.inputTokens.toLocaleString()}`,
                  inputTokenRatio,
                  'var(--color-info)',
                ],
                [
                  'output tokens',
                  `+${usage.outputTokens.toLocaleString()}`,
                  outputTokenRatio,
                  'var(--color-warn)',
                ],
                [
                  'time',
                  `${elapsed} / ${formatElapsed(challengeDef.baseline.timeSeconds)}`,
                  sessionSeconds / challengeDef.baseline.timeSeconds,
                  'var(--color-err)',
                ],
                [
                  'attempts',
                  `${attemptCount} / ${challengeDef.maxAttempts}`,
                  attemptCount / challengeDef.maxAttempts,
                  'var(--color-acc)',
                ],
              ] as [string, string, number, string][]
            ).map(([label, value, ratio, color]) => (
              <div key={label}>
                <div className="flex justify-between mb-0.5">
                  <span className="font-mono text-text-3" style={{ fontSize: 10 }}>
                    {label}
                  </span>
                  <span className="font-mono text-text-2" style={{ fontSize: 10 }}>
                    {value}
                  </span>
                </div>
                <ProgressBar value={Math.min(100, ratio * 100)} color={color} height={3} />
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
                {AI_CONFIG.modelLabel}
              </span>
            </div>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onUseArtifact={(code) => addArtifactVersion(code, 'AI')}
              />
            ))}
            {isLoading ? (
              <div
                className="flex gap-3 border-b border-line"
                style={{ padding: '14px 18px', background: 'var(--color-bg-1)' }}
              >
                <div
                  className="grid place-items-center rounded shrink-0 font-mono font-semibold"
                  style={{
                    width: 22,
                    height: 22,
                    background: 'var(--color-acc-dim)',
                    color: 'var(--color-acc)',
                    fontSize: 10,
                  }}
                >
                  AI
                </div>
                <div
                  className="flex items-center gap-2 font-mono text-text-3"
                  style={{ fontSize: 11 }}
                >
                  <span>{AI_CONFIG.displayName} 응답 생성 중</span>
                  <span className="caret" />
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-line bg-bg-0" style={{ padding: 14 }}>
            <div
              className="flex gap-1 mb-2 font-mono"
              style={{ fontSize: 10, color: 'var(--color-text-3)' }}
            >
              <span className="text-acc">tip</span>
              <span>이전 응답을 참조하면 더 효율적이에요. (예: &quot;위 패턴에서…&quot;)</span>
            </div>
            {error ? (
              <div
                className="mb-2 rounded border"
                style={{
                  padding: '9px 10px',
                  fontSize: 12,
                  borderColor: 'rgba(255, 119, 77, 0.35)',
                  color: 'var(--color-err)',
                  background: 'rgba(255, 119, 77, 0.08)',
                }}
              >
                {error}
              </div>
            ) : null}
            {submitError ? (
              <div
                className="mb-2 rounded border"
                style={{
                  padding: '9px 10px',
                  fontSize: 12,
                  borderColor: 'rgba(255, 119, 77, 0.35)',
                  color: 'var(--color-err)',
                  background: 'rgba(255, 119, 77, 0.08)',
                }}
              >
                {submitError}
              </div>
            ) : null}
            <div className="border border-line-2 rounded-md bg-bg-1" style={{ padding: 10 }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    void handleSendMessage();
                  }
                }}
                placeholder="AI에게 프롬프트 입력... (⌘↵ 전송)"
                rows={3}
                className="w-full bg-transparent border-none outline-none text-text-1 resize-none"
                style={{ fontSize: 13, lineHeight: 1.5 }}
              />
              <div className="flex items-center justify-between pt-2 border-t border-line">
                <div className="font-mono text-text-3" style={{ fontSize: 10.5 }}>
                  in +{usage.inputTokens.toLocaleString()} · out +
                  {usage.outputTokens.toLocaleString()}
                </div>
                <button
                  onClick={() => void handleSendMessage()}
                  className="inline-flex items-center gap-2 bg-acc text-acc-ink font-medium rounded-md border border-acc cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontSize: 12, padding: '5px 10px' }}
                  disabled={!input.trim() || isLoading}
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
            {artifactVersions.map((v) => (
              <div
                key={v.id}
                onClick={() => setActiveArtifact(v.id)}
                className="font-mono rounded cursor-pointer"
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  background: activeArtifact === v.id ? 'var(--color-acc-dim)' : 'transparent',
                  color: activeArtifact === v.id ? 'var(--color-acc)' : 'var(--color-text-3)',
                  border: `1px solid ${activeArtifact === v.id ? 'var(--color-acc-line)' : 'var(--color-line-2)'}`,
                }}
              >
                {v.label} <span style={{ opacity: 0.6, fontSize: 9 }}>·{v.src}</span>
              </div>
            ))}
            <button
              onClick={() => addArtifactVersion(currentArtifact, 'edited')}
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
                {currentArtifact.split('\n').map((_, i) => (
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
                dangerouslySetInnerHTML={{ __html: highlightJs(currentArtifact) }}
              />
            </div>
          </div>

          <div className="border-t border-line flex flex-col gap-2" style={{ padding: 12 }}>
            <div className="flex gap-1.5">
              <button
                onClick={() => addArtifactVersion(currentArtifact, 'edited')}
                className="flex-1 flex items-center justify-center rounded border border-line text-text-1 bg-transparent hover:bg-bg-2 cursor-pointer"
                style={{ fontSize: 12, padding: '5px 10px' }}
              >
                💾 버전 저장
              </button>
              <button
                onClick={() => void navigator.clipboard.writeText(currentArtifact)}
                className="flex-1 flex items-center justify-center rounded border border-line text-text-1 bg-transparent hover:bg-bg-2 cursor-pointer"
                style={{ fontSize: 12, padding: '5px 10px' }}
              >
                🧪 로컬 테스트
              </button>
            </div>
            <button
              onClick={handleSubmitForEvaluation}
              className="w-full flex items-center justify-center bg-acc text-acc-ink font-semibold rounded-md border border-acc cursor-pointer transition-[filter] hover:brightness-105"
              style={{ padding: 10, fontSize: 13 }}
            >
              최종 제출 → 채점 시작
            </button>
            <div className="font-mono text-text-3 text-center" style={{ fontSize: 9.5 }}>
              제출 시 시도 카운트 +1 · 환불 불가
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
