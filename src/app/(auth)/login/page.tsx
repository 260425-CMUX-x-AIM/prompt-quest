'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';

type Stage = 'email' | 'code';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError(null);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (otpError) {
      setError('코드 발송에 실패했습니다. 이메일 주소를 확인해 주세요.');
      return;
    }
    setStage('code');
    setResendCooldown(60);
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    if (code.length !== 8 || loading) return;
    setLoading(true);
    setError(null);

    // type: 'email' 은 GoTrue 서버에서 confirmation_token / recovery_token 양쪽을
    // 모두 조회하는 catch-all 이므로 신규 가입과 기존 사용자 로그인을 한 번에 처리.
    // (signup/magiclink/recovery 로 나눠 폴백 호출하면 /verify rate-limit 만 소모)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });

    setLoading(false);
    if (verifyError) {
      setError('잘못된 코드이거나 만료되었습니다.');
      return;
    }
    router.replace('/tasks');
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-0 text-text-1 px-4">
      <div
        className="w-full bg-bg-1 border border-line rounded-[12px]"
        style={{ maxWidth: 380, padding: '32px 28px' }}
      >
        <div className="flex justify-center mb-7">
          <Logo />
        </div>

        {stage === 'email' && (
          <form onSubmit={sendCode} className="flex flex-col gap-3.5">
            <label
              className="font-mono text-text-3"
              style={{ fontSize: 11, letterSpacing: '0.06em' }}
            >
              이메일
            </label>
            <input
              type="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-md bg-bg-2 border border-line outline-none focus:border-acc"
              style={{ padding: '10px 12px', fontSize: 13 }}
              disabled={loading}
            />
            {error && (
              <div className="text-err font-mono" style={{ fontSize: 11.5 }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="rounded-md bg-acc font-medium disabled:opacity-50"
              style={{
                padding: '10px 14px',
                fontSize: 13,
                color: 'var(--color-acc-ink)',
              }}
            >
              {loading ? '코드 보내는 중…' : '코드 받기'}
            </button>
          </form>
        )}

        {stage === 'code' && (
          <form onSubmit={verify} className="flex flex-col gap-3.5">
            <div className="text-text-2" style={{ fontSize: 12, lineHeight: 1.5 }}>
              <span className="font-mono text-text-3">{email}</span> 로<br />
              8자리 인증 코드를 보냈습니다.
            </div>
            <label
              className="font-mono text-text-3"
              style={{ fontSize: 11, letterSpacing: '0.06em' }}
            >
              인증 코드
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{8}"
              autoFocus
              required
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="00000000"
              className="rounded-md bg-bg-2 border border-line font-mono outline-none focus:border-acc text-center"
              style={{ padding: '12px', fontSize: 18, letterSpacing: '0.4em' }}
              disabled={loading}
            />
            {error && (
              <div className="text-err font-mono" style={{ fontSize: 11.5 }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || code.length !== 8}
              className="rounded-md bg-acc font-medium disabled:opacity-50"
              style={{
                padding: '10px 14px',
                fontSize: 13,
                color: 'var(--color-acc-ink)',
              }}
            >
              {loading ? '확인 중…' : '확인'}
            </button>
            <div className="flex justify-between mt-1" style={{ fontSize: 11.5 }}>
              <button
                type="button"
                onClick={() => {
                  setStage('email');
                  setCode('');
                  setError(null);
                }}
                className="text-text-3 hover:text-text-2"
              >
                ← 이메일 다시
              </button>
              <button
                type="button"
                onClick={() => sendCode()}
                disabled={resendCooldown > 0 || loading}
                className="text-text-3 hover:text-text-2 disabled:opacity-50"
              >
                {resendCooldown > 0 ? `재전송 ${resendCooldown}s` : '코드 재전송'}
              </button>
            </div>
          </form>
        )}

        <div
          className="mt-6 pt-5 border-t border-line text-text-3"
          style={{ fontSize: 11, lineHeight: 1.6 }}
        >
          로그인 시{' '}
          <Link href="/terms" className="underline">
            이용약관
          </Link>{' '}
          및{' '}
          <Link href="/privacy" className="underline">
            개인정보처리방침
          </Link>
          에 동의한 것으로 간주됩니다.
        </div>
      </div>
    </div>
  );
}
