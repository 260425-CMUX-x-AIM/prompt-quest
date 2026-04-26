'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from './Logo';
import { createClient } from '@/lib/supabase/client';

type NavItem = {
  id: string;
  label: string;
  href: string;
  soon?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'tasks', label: 'Tasks', href: '/tasks' },
  { id: 'leaderboard', label: 'Leaderboard', href: '/leaderboard' },
  { id: 'me', label: 'My', href: '/me' },
];

type AuthState = 'loading' | 'authed' | 'unauthed';

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  // 매 렌더마다 supabase 클라이언트 재생성 방지
  const supabase = useMemo(() => createClient(), []);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    function applyUser(user: { email?: string | null } | null | undefined) {
      if (!user) {
        setAuthState('unauthed');
        setUsername('');
        return;
      }
      const email = user.email ?? '';
      setUsername(email.split('@')[0] || 'user');
      setAuthState('authed');
    }

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      applyUser(data.user);
    });

    // 로그아웃·로그인 즉시 반영
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      applyUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const getActive = () => {
    if (pathname.startsWith('/tasks') || pathname.startsWith('/challenge')) return 'tasks';
    if (pathname.startsWith('/leaderboard')) return 'leaderboard';
    if (pathname.startsWith('/my-dojo') || pathname.startsWith('/me')) return 'me';
    return '';
  };

  const active = getActive();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <div
      className="flex items-center justify-between shrink-0 border-b border-line bg-bg-0"
      style={{ padding: '10px 20px', height: 48 }}
    >
      <div className="flex items-center gap-7">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex gap-1">
          {NAV_ITEMS.map((it) => (
            <Link
              key={it.id}
              href={it.href}
              className="flex items-center gap-1.5 rounded"
              style={{
                padding: '5px 10px',
                fontSize: 13,
                color: active === it.id ? 'var(--color-text-1)' : 'var(--color-text-3)',
                background: active === it.id ? 'var(--color-bg-2)' : 'transparent',
                fontWeight: active === it.id ? 500 : 400,
              }}
            >
              {it.label}
              {it.soon && (
                <span className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-4)' }}>
                  SOON
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3.5">
        {authState === 'authed' && (
          <>
            <div
              className="flex items-center gap-2"
              style={{ fontSize: 12, color: 'var(--color-text-2)' }}
            >
              <div
                className="grid place-items-center rounded"
                style={{
                  width: 22,
                  height: 22,
                  background: 'linear-gradient(135deg, var(--color-acc), oklch(0.7 0.15 130))',
                  color: 'var(--color-acc-ink)',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {(username[0] ?? '').toUpperCase()}
              </div>
              <span className="font-mono">{username}</span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="font-mono text-text-3 hover:text-text-2"
              style={{ fontSize: 11, letterSpacing: '0.04em' }}
            >
              logout
            </button>
          </>
        )}
        {authState === 'unauthed' && (
          <Link
            href="/login"
            className="font-mono rounded bg-acc text-acc-ink"
            style={{ padding: '5px 12px', fontSize: 12 }}
          >
            로그인
          </Link>
        )}
        {/* loading 상태에서는 우측 영역 비워둠 — flash 방지 */}
      </div>
    </div>
  );
}
