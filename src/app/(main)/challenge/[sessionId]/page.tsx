'use client';

import { use, useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { DiffTag } from '@/components/Tags';
import { getClientAiConfig } from '@/lib/ai-provider.client';
import { extractCodeBlocks } from '@/lib/challenge';
import { getErrorMessage } from '@/lib/api/errors';
import type {
  ApiError,
  CreateArtifactResponse,
  GetSessionResponse,
  SendMessageResponse,
  SubmitResponse,
  UpdateArtifactResponse,
} from '@/lib/api/contracts';
import type { Artifact, CodeBlock, Message } from '@/lib/types/session';

type ChallengeChatMessage = Pick<
  Message,
  'id' | 'role' | 'content' | 'input_tokens' | 'output_tokens' | 'extracted_code_blocks'
>;

function elapsedString(startIso: string, now: number): string {
  const sec = Math.max(0, Math.floor((now - new Date(startIso).getTime()) / 1000));
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function MessageBubble({
  msg,
  modelLabel,
  onAddToArtifact,
}: {
  msg: ChallengeChatMessage;
  modelLabel: string;
  onAddToArtifact: (block: CodeBlock) => void;
}) {
  const isUser = msg.role === 'user';
  const blocks = msg.extracted_code_blocks?.blocks ?? [];
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
            {isUser ? 'me' : modelLabel}
          </span>
          {(msg.input_tokens != null || msg.output_tokens != null) && (
            <span className="font-mono text-text-4" style={{ fontSize: 10 }}>
              · {(msg.input_tokens ?? 0) + (msg.output_tokens ?? 0)} tok
            </span>
          )}
        </div>
        <div className="whitespace-pre-wrap" style={{ fontSize: 13, lineHeight: 1.6 }}>
          {msg.content}
        </div>
        {!isUser && blocks.length > 0 && (
          <div className="mt-2.5 flex flex-col gap-2">
            {blocks.map((block) => (
              <div key={block.id} className="border border-line-2 rounded-md overflow-hidden">
                <div
                  className="flex items-center justify-between border-b border-line-2 bg-bg-2"
                  style={{ padding: '6px 10px' }}
                >
                  <span className="font-mono text-text-3" style={{ fontSize: 10.5 }}>
                    {block.language} · {block.line_count} lines
                  </span>
                  <button
                    type="button"
                    onClick={() => onAddToArtifact(block)}
                    className="font-mono rounded border border-acc bg-acc text-acc-ink cursor-pointer"
                    style={{ fontSize: 11, padding: '3px 8px' }}
                  >
                    + 결과물에 추가
                  </button>
                </div>
                <pre
                  className="font-mono whitespace-pre overflow-x-auto"
                  style={{ fontSize: 12, padding: '10px 12px', background: '#0a0c0f' }}
                >
                  {block.content}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingBubble({ modelLabel }: { modelLabel: string }) {
  return (
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
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="font-mono text-text-3" style={{ fontSize: 10, letterSpacing: '0.04em' }}>
            {modelLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 text-text-3" style={{ fontSize: 13 }}>
          <span className="inline-block h-2 w-2 rounded-full bg-acc animate-pulse" />
          답변을 생성하는 중…
        </div>
      </div>
    </div>
  );
}

export default function ChallengePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const aiConfig = getClientAiConfig();

  const [data, setData] = useState<GetSessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [optimisticUserMessage, setOptimisticUserMessage] = useState<ChallengeChatMessage | null>(
    null,
  );

  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [artifactDraft, setArtifactDraft] = useState('');
  const [savingArtifact, setSavingArtifact] = useState(false);
  const [artifactDirty, setArtifactDirty] = useState(false);

  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const chatRef = useRef<HTMLDivElement>(null);

  // 초기 페치 + 가드
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sessions/${sessionId}`)
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
        const json = (await res.json()) as GetSessionResponse;
        if (cancelled) return;
        if (json.session.status !== 'in_progress') {
          router.replace(`/results/${sessionId}`);
          return;
        }
        setData(json);
        setArtifacts(json.artifacts);
        const finalArtifact = json.artifacts.find((a) => a.is_final) ?? json.artifacts.at(-1);
        if (finalArtifact) {
          setActiveArtifactId(finalArtifact.id);
          setArtifactDraft(finalArtifact.content);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('세션을 불러올 수 없습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  // elapsed timer
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // chat 자동 스크롤
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [data?.messages.length, optimisticUserMessage, sending]);

  if (loading) {
    return (
      <div
        className="grid place-items-center h-screen bg-bg-0 text-text-3"
        style={{ fontSize: 12 }}
      >
        세션을 불러오는 중…
      </div>
    );
  }
  if (loadError || !data) {
    return (
      <div className="grid place-items-center h-screen bg-bg-0">
        <div className="text-err font-mono" style={{ fontSize: 13 }}>
          {loadError ?? '세션을 찾을 수 없습니다.'}
        </div>
      </div>
    );
  }

  const session = data.session;
  const task = data.task;
  const messages = data.messages;
  const starterMessage: ChallengeChatMessage = {
    id: 'starter-assistant-message',
    role: 'assistant',
    content: '무엇을 도와드릴까요?',
    input_tokens: null,
    output_tokens: null,
    extracted_code_blocks: null,
  };
  const visibleMessages: ChallengeChatMessage[] = [
    ...(messages.length === 0 ? [starterMessage] : messages),
    ...(optimisticUserMessage ? [optimisticUserMessage] : []),
  ];
  const activeArtifact = artifacts.find((a) => a.id === activeArtifactId) ?? null;
  const elapsed = elapsedString(session.started_at, now);
  const attempts = `${session.attempt_count}/${task.constraints.max_attempts}`;

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (sending || !input.trim()) return;
    setSending(true);
    setSendError(null);
    const content = input;
    setOptimisticUserMessage({
      id: `optimistic-user-${Date.now()}`,
      role: 'user',
      content,
      input_tokens: null,
      output_tokens: null,
      extracted_code_blocks: null,
    });
    setInput('');
    try {
      const res = await fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        setSendError(getErrorMessage(err?.error?.code));
        setInput(content);
        setOptimisticUserMessage(null);
        return;
      }
      const json = (await res.json()) as SendMessageResponse;
      setOptimisticUserMessage(null);
      setData((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, json.userMessage, json.aiMessage],
              session: {
                ...prev.session,
                message_count: prev.session.message_count + 2,
                total_input_tokens:
                  prev.session.total_input_tokens + (json.aiMessage.input_tokens ?? 0),
                total_output_tokens:
                  prev.session.total_output_tokens + (json.aiMessage.output_tokens ?? 0),
              },
            }
          : prev,
      );
    } catch {
      setSendError('메시지 전송에 실패했습니다.');
      setInput(content);
      setOptimisticUserMessage(null);
    } finally {
      setSending(false);
    }
  }

  async function addToArtifact(block: CodeBlock) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/artifacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: block.content,
          language: block.language,
          source: 'ai_extracted',
        }),
      });
      if (!res.ok) return;
      const json = (await res.json()) as CreateArtifactResponse;
      setArtifacts((prev) => [...prev, json.artifact]);
      setActiveArtifactId(json.artifact.id);
      setArtifactDraft(json.artifact.content);
      setArtifactDirty(false);
    } catch {
      // ignore
    }
  }

  async function saveArtifactEdit() {
    if (!activeArtifact || !artifactDirty || savingArtifact) return;
    setSavingArtifact(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/artifacts/${activeArtifact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: artifactDraft,
          source: 'user_edited',
        }),
      });
      if (!res.ok) return;
      const json = (await res.json()) as UpdateArtifactResponse;
      setArtifacts((prev) => prev.map((a) => (a.id === json.artifact.id ? json.artifact : a)));
      setArtifactDirty(false);
    } finally {
      setSavingArtifact(false);
    }
  }

  async function submitArtifact() {
    if (!activeArtifact || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // 편집 중이면 먼저 저장
      if (artifactDirty) await saveArtifactEdit();

      const res = await fetch(`/api/sessions/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifact_id: activeArtifact.id }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        setSubmitError(getErrorMessage(err?.error?.code));
        setSubmitting(false);
        return;
      }
      await (res.json() as Promise<SubmitResponse>);
      router.push(`/results/${sessionId}`);
    } catch {
      setSubmitError('제출에 실패했습니다.');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-0 text-text-1">
      {/* 슬림 헤더 */}
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
            {task.metadata.id}
          </span>
          <DiffTag level={task.metadata.difficulty} />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3.5 font-mono" style={{ fontSize: 11.5 }}>
            <span className="text-text-3">
              ⏱ <span className="text-text-1">{elapsed}</span>
            </span>
            <span className="text-text-3">
              in <span className="text-text-1">{session.total_input_tokens.toLocaleString()}</span>
            </span>
            <span className="text-text-3">
              out{' '}
              <span className="text-text-1">{session.total_output_tokens.toLocaleString()}</span>
            </span>
            <span className="text-text-3">
              ↻ <span className="text-text-1">{attempts}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSubmitOpen(true)}
            disabled={!activeArtifact}
            title={!activeArtifact ? 'AI 응답에서 코드를 추가해 주세요' : ''}
            className="rounded bg-acc text-acc-ink font-medium disabled:opacity-50 cursor-pointer"
            style={{ padding: '5px 12px', fontSize: 12 }}
          >
            최종 제출
          </button>
        </div>
      </div>

      {/* 3분할 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌: 태스크 정보 */}
        <div
          className="shrink-0 border-r border-line overflow-y-auto custom-scroll"
          style={{ width: 260, padding: '16px 18px' }}
        >
          <div
            className="font-mono text-text-3 mb-2"
            style={{ fontSize: 10, letterSpacing: '0.08em' }}
          >
            TASK
          </div>
          <div className="font-medium mb-3" style={{ fontSize: 14 }}>
            {task.metadata.title}
          </div>
          <p className="text-text-2 mb-5" style={{ fontSize: 12, lineHeight: 1.55 }}>
            {task.context.scenario || task.context.background}
          </p>
          <div
            className="font-mono text-text-3 mb-2"
            style={{ fontSize: 10, letterSpacing: '0.08em' }}
          >
            REQUIREMENTS
          </div>
          <div className="flex flex-col gap-1.5">
            {task.requirements.map((r) => (
              <div
                key={r.id}
                className="bg-bg-1 border border-line rounded"
                style={{ padding: '7px 10px', fontSize: 12, lineHeight: 1.45 }}
              >
                <span className="font-mono text-acc mr-1.5" style={{ fontSize: 10 }}>
                  {r.id}
                </span>
                {r.description}
              </div>
            ))}
          </div>
        </div>

        {/* 중: 대화 */}
        <div className="flex flex-col flex-1 overflow-hidden border-r border-line">
          <div ref={chatRef} className="flex-1 overflow-y-auto custom-scroll">
            {visibleMessages.map((m) => (
              <MessageBubble
                key={m.id}
                msg={m}
                modelLabel={aiConfig.modelLabel}
                onAddToArtifact={addToArtifact}
              />
            ))}
            {sending && <ThinkingBubble modelLabel={aiConfig.modelLabel} />}
          </div>
          <form
            onSubmit={sendMessage}
            className="border-t border-line flex flex-col"
            style={{ padding: '10px 14px' }}
          >
            {sendError && (
              <div className="text-err font-mono mb-1.5" style={{ fontSize: 11 }}>
                {sendError}
              </div>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={sending ? 'AI 응답 대기 중…' : 'Claude 에게 프롬프트를 입력하세요'}
              disabled={sending}
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  sendMessage(e as unknown as FormEvent);
                }
              }}
              className="font-mono resize-none rounded bg-bg-1 border border-line outline-none focus:border-acc"
              style={{ padding: '8px 10px', fontSize: 12.5, lineHeight: 1.5 }}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="font-mono text-text-4" style={{ fontSize: 10 }}>
                {sending ? '전송 중…' : '⌘+Enter 로 전송'}
              </span>
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="rounded bg-acc text-acc-ink font-medium disabled:opacity-50 cursor-pointer"
                style={{ padding: '5px 12px', fontSize: 12 }}
              >
                전송
              </button>
            </div>
          </form>
        </div>

        {/* 우: artifact */}
        <div className="shrink-0 flex flex-col overflow-hidden" style={{ width: 380 }}>
          <div
            className="border-b border-line flex items-center justify-between"
            style={{ padding: '10px 14px' }}
          >
            <div
              className="font-mono text-text-3"
              style={{ fontSize: 10, letterSpacing: '0.08em' }}
            >
              결과물 {activeArtifact ? `· v${activeArtifact.version}` : ''}
            </div>
            {activeArtifact && (
              <button
                type="button"
                onClick={saveArtifactEdit}
                disabled={!artifactDirty || savingArtifact}
                className="font-mono rounded border border-line text-text-2 disabled:opacity-40 cursor-pointer"
                style={{ fontSize: 11, padding: '3px 8px' }}
              >
                {savingArtifact ? '저장 중…' : artifactDirty ? '저장' : '저장됨'}
              </button>
            )}
          </div>
          {!activeArtifact ? (
            <div className="text-text-3 p-5" style={{ fontSize: 12, lineHeight: 1.5 }}>
              AI 응답에서 코드 블록의 <span className="font-mono">+ 결과물에 추가</span> 버튼을 눌러
              결과물을 만들어 보세요.
            </div>
          ) : (
            <textarea
              value={artifactDraft}
              onChange={(e) => {
                setArtifactDraft(e.target.value);
                setArtifactDirty(e.target.value !== activeArtifact.content);
              }}
              spellCheck={false}
              className="font-mono flex-1 resize-none bg-[#0a0c0f] outline-none"
              style={{
                padding: '12px 14px',
                fontSize: 12.5,
                lineHeight: 1.55,
                color: 'var(--color-text-1)',
              }}
            />
          )}
          {artifacts.length > 1 && (
            <div className="border-t border-line" style={{ padding: '8px 14px' }}>
              <div
                className="font-mono text-text-4 mb-1.5"
                style={{ fontSize: 10, letterSpacing: '0.06em' }}
              >
                VERSIONS
              </div>
              <div className="flex flex-wrap gap-1">
                {artifacts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setActiveArtifactId(a.id);
                      setArtifactDraft(a.content);
                      setArtifactDirty(false);
                    }}
                    className="font-mono rounded border"
                    style={{
                      fontSize: 11,
                      padding: '2px 7px',
                      borderColor:
                        a.id === activeArtifactId ? 'var(--color-acc)' : 'var(--color-line-2)',
                      background:
                        a.id === activeArtifactId ? 'var(--color-acc-dim)' : 'transparent',
                      color: a.id === activeArtifactId ? 'var(--color-acc)' : 'var(--color-text-2)',
                    }}
                  >
                    v{a.version}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 제출 모달 */}
      {submitOpen && (
        <div className="fixed inset-0 grid place-items-center bg-black/50 z-50">
          <div
            className="bg-bg-1 border border-line rounded-[12px] p-6 flex flex-col gap-4"
            style={{ width: 380 }}
          >
            <div className="text-text-1" style={{ fontSize: 14 }}>
              최종 제출하시겠습니까?
            </div>
            <div className="text-text-3" style={{ fontSize: 12, lineHeight: 1.5 }}>
              제출 후에는 수정할 수 없으며 채점이 시작됩니다. (약 30초)
            </div>
            {submitError && (
              <div className="text-err font-mono" style={{ fontSize: 11.5 }}>
                {submitError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSubmitOpen(false)}
                disabled={submitting}
                className="rounded-md border border-line text-text-2 flex-1 cursor-pointer"
                style={{ padding: '10px 14px', fontSize: 13 }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitArtifact}
                disabled={submitting || !activeArtifact}
                className="rounded-md bg-acc font-medium flex-1 disabled:opacity-50 cursor-pointer"
                style={{ padding: '10px 14px', fontSize: 13, color: 'var(--color-acc-ink)' }}
              >
                {submitting ? '제출 중…' : '제출'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// extractCodeBlocks 사용은 추후 client-side 추가 추출 로직에 활용 (현재는 서버에서 추출).
void extractCodeBlocks;
