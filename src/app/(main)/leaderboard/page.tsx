'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Pagination from '@/components/Pagination';
import { CategoryTag, DiffTag } from '@/components/Tags';
import { getErrorMessage } from '@/lib/api/errors';
import type { ApiError, PublicAttemptItem, PublicAttemptsResponse } from '@/lib/api/contracts';

const PAGE_SIZE = 10;

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}/${day}`;
}

function truncatePrompt(prompt: string) {
  const compact = prompt.replace(/\s+/g, ' ').trim();
  if (compact.length <= 220) return compact;
  return `${compact.slice(0, 220)}...`;
}

function AttemptCard({ attempt, rank }: { attempt: PublicAttemptItem; rank: number }) {
  const displayName = attempt.user.display_name || attempt.user.username;

  return (
    <article className="bg-bg-1 border border-line rounded-[12px] overflow-hidden">
      <div
        className="grid items-start gap-5 border-b border-line"
        style={{ gridTemplateColumns: '72px 1fr 120px', padding: '18px 20px' }}
      >
        <div>
          <div className="font-mono text-text-4 mb-1" style={{ fontSize: 10 }}>
            RANK
          </div>
          <div className="font-mono text-acc font-semibold" style={{ fontSize: 26 }}>
            #{rank}
          </div>
        </div>

        <div>
          <div className="flex gap-2 mb-2">
            <CategoryTag cat={attempt.task.category} />
            <DiffTag level={attempt.task.difficulty} />
            <span className="font-mono text-text-3" style={{ fontSize: 11 }}>
              {formatDate(attempt.evaluated_at)}
            </span>
          </div>
          <h2 className="font-medium mb-1" style={{ fontSize: 17 }}>
            {attempt.task.title}
          </h2>
          <div className="font-mono text-text-3" style={{ fontSize: 11 }}>
            <Link
              href={`/user/${attempt.user.username}`}
              className="hover:text-text-2 underline underline-offset-2"
            >
              @{displayName}
            </Link>{' '}
            · {attempt.message_count} messages · {attempt.total_tokens.toLocaleString()} tokens
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-text-4 mb-1" style={{ fontSize: 10 }}>
            SCORE
          </div>
          <div className="font-mono font-semibold text-acc" style={{ fontSize: 34, lineHeight: 1 }}>
            {attempt.score}
          </div>
          {attempt.percentile != null && (
            <div className="font-mono text-text-3 mt-1" style={{ fontSize: 10 }}>
              p{attempt.percentile.toFixed(1)}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 20px 18px' }}>
        <div
          className="font-mono text-text-3 mb-2"
          style={{ fontSize: 10, letterSpacing: '0.08em' }}
        >
          USED PROMPTS
        </div>
        <div className="flex flex-col gap-2">
          {attempt.prompts.length === 0 && (
            <div className="text-text-3" style={{ fontSize: 12 }}>
              공개할 사용자 프롬프트가 없습니다.
            </div>
          )}
          {attempt.prompts.map((prompt, index) => (
            <blockquote
              key={`${attempt.session_id}-${index}`}
              className="font-mono bg-bg-0 border border-line rounded-md text-text-2"
              style={{ fontSize: 12, lineHeight: 1.55, padding: '10px 12px' }}
            >
              {truncatePrompt(prompt)}
            </blockquote>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function LeaderboardPage() {
  const [page, setPage] = useState(1);
  const [attempts, setAttempts] = useState<PublicAttemptItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/leaderboard?page=${page}&limit=${PAGE_SIZE}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as ApiError | null;
          setError(getErrorMessage(data?.error?.code));
          return;
        }
        const data = (await res.json()) as PublicAttemptsResponse;
        setError(null);
        setAttempts(data.attempts);
        setTotal(data.total);
      })
      .catch(() => {
        if (!cancelled) setError('공개 풀이를 불러올 수 없습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-0 text-text-1">
      <NavBar />
      <div className="flex-1 overflow-y-auto custom-scroll">
        <div className="max-w-[980px] mx-auto" style={{ padding: '32px 36px' }}>
          <div className="flex items-end justify-between border-b border-line mb-6 pb-6">
            <div>
              <div
                className="font-mono text-text-3 mb-2"
                style={{ fontSize: 10, letterSpacing: '0.08em' }}
              >
                COMMUNITY RUNS
              </div>
              <h1 className="font-medium mb-1.5" style={{ fontSize: 28 }}>
                다른 사람들의 프롬프트와 점수
              </h1>
              <p className="text-text-3" style={{ fontSize: 13 }}>
                평가 완료된 챌린지에서 높은 점수 순으로 실제 사용자 프롬프트 일부를 보여줍니다.
              </p>
            </div>
            <div className="font-mono text-text-3" style={{ fontSize: 11 }}>
              {loading ? '불러오는 중...' : `${total} attempts`}
            </div>
          </div>

          {error && (
            <div className="text-err font-mono mb-4" style={{ fontSize: 12 }}>
              {error}
            </div>
          )}

          {loading && (
            <div className="text-text-3" style={{ fontSize: 12 }}>
              공개 풀이를 불러오는 중...
            </div>
          )}

          {!loading && !error && attempts.length === 0 && (
            <div
              className="bg-bg-1 border border-line rounded-[10px] p-5 text-text-3"
              style={{ fontSize: 12 }}
            >
              아직 공개할 평가 완료 세션이 없습니다.
            </div>
          )}

          <div className="flex flex-col gap-3.5">
            {attempts.map((attempt, index) => (
              <AttemptCard
                key={attempt.session_id}
                attempt={attempt}
                rank={(page - 1) * PAGE_SIZE + index + 1}
              />
            ))}
          </div>

          <Pagination
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="attempts"
            className="mt-5"
          />
        </div>
      </div>
    </div>
  );
}
