'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from './Logo';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { id: 'tasks', label: 'Tasks', href: '/tasks' },
  { id: 'leaderboard', label: 'Leaderboard', href: '#', soon: true },
  { id: 'me', label: 'My', href: '/me' },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<string>('—');

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      const email = data.user.email ?? '';
      setUser(email.split('@')[0] || 'user');
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const getActive = () => {
    if (pathname.startsWith('/tasks') || pathname.startsWith('/challenge')) return 'tasks';
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
            }}
          >
            K
          </div>
          <span className="font-mono">{user}</span>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="font-mono text-text-3 hover:text-text-2"
          style={{ fontSize: 11, letterSpacing: '0.04em' }}
        >
          logout
        </button>
      </div>
    </div>
  );
}
