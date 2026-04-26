import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { successNextSteps, successReceipt } from '@/lib/pricing';

export default function PricingSuccessPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-0 text-text-1">
      <NavBar />
      <div className="flex flex-1 items-center justify-center p-10">
        <div className="w-full max-w-[520px] text-center">
          <div
            className="mx-auto mb-6 grid place-items-center rounded-full border-2 border-acc"
            style={{
              width: 72,
              height: 72,
              background: 'oklch(0.86 0.2 130 / 0.12)',
              boxShadow: '0 0 0 6px oklch(0.86 0.2 130 / 0.08)',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path
                d="M8 16 L14 22 L24 10"
                stroke="var(--color-acc)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div
            className="mb-2 font-mono text-acc"
            style={{ fontSize: 11, letterSpacing: '0.08em' }}
          >
            PAYMENT SUCCESSFUL
          </div>
          <h1 className="mb-2 font-medium" style={{ fontSize: 28, letterSpacing: '-0.01em' }}>
            결제가 완료되었어요.
          </h1>
          <p className="mb-7 text-text-2" style={{ fontSize: 14, lineHeight: 1.55 }}>
            PRO 플랜이 활성화되었다는 데모 상태 화면입니다. 이제 모든 난이도와 풀 채점이 열리는
            시나리오를 보여줍니다.
          </p>

          <div className="mb-6 overflow-hidden rounded-[10px] border border-line bg-bg-1 text-left">
            <div className="flex items-center justify-between border-b border-line bg-bg-2 px-4 py-2.5">
              <span
                className="font-mono text-text-3"
                style={{ fontSize: 10, letterSpacing: '0.06em' }}
              >
                RECEIPT · #PQ-2026-0428-3812
              </span>
              <span className="h-[7px] w-[7px] rounded-full bg-ok" />
            </div>
            <div className="px-[18px] py-4">
              {successReceipt.map(([label, value], index) => (
                <div
                  key={label}
                  className="flex justify-between py-2"
                  style={{
                    borderBottom:
                      index < successReceipt.length - 1 ? '1px solid var(--color-line)' : 'none',
                  }}
                >
                  <span className="text-text-3" style={{ fontSize: 12.5 }}>
                    {label}
                  </span>
                  <span className="font-mono text-text-1" style={{ fontSize: 12.5 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6 text-left">
            <div
              className="mb-2 font-mono text-text-3"
              style={{ fontSize: 10, letterSpacing: '0.08em' }}
            >
              다음 단계
            </div>
            <div className="flex flex-col gap-2">
              {successNextSteps.map((step) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-md border border-line bg-bg-1 px-[14px] py-[10px]"
                >
                  <span className="font-mono text-acc" style={{ fontSize: 12 }}>
                    -&gt;
                  </span>
                  <span style={{ fontSize: 13 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/tasks"
              className="inline-flex flex-1 items-center justify-center rounded-md border border-acc bg-acc text-acc-ink hover:brightness-105"
              style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600 }}
            >
              태스크 시작하기
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-md border border-line bg-transparent px-4 text-text-1 hover:bg-bg-2"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              요금제로 돌아가기
            </Link>
          </div>

          <div className="mt-5 font-mono text-text-3" style={{ fontSize: 10.5 }}>
            영수증 사본을 이메일로도 발송했다는 가정의 데모입니다.
          </div>
        </div>
      </div>
    </div>
  );
}
