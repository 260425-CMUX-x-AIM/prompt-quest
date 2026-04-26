import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { failedReceipt, failureSuggestions } from '@/lib/pricing';

export default function PricingFailedPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-0 text-text-1">
      <NavBar />
      <div className="flex flex-1 items-center justify-center p-10">
        <div className="w-full max-w-[520px] text-center">
          <div
            className="mx-auto mb-6 grid place-items-center rounded-full border-2 border-err"
            style={{
              width: 72,
              height: 72,
              background: 'oklch(0.72 0.18 25 / 0.12)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M9 9 L19 19 M19 9 L9 19"
                stroke="var(--color-err)"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div
            className="mb-2 font-mono text-err"
            style={{ fontSize: 11, letterSpacing: '0.08em' }}
          >
            PAYMENT FAILED · ERR_CARD_DECLINED
          </div>
          <h1 className="mb-2.5 font-medium" style={{ fontSize: 26, letterSpacing: '-0.01em' }}>
            결제에 실패했어요.
          </h1>
          <p className="mb-6 text-text-2" style={{ fontSize: 14, lineHeight: 1.55 }}>
            카드사 보안 정책이나 한도 이슈로 결제가 거절되었다는 데모 화면입니다. 다시 시도하거나
            다른 결제 수단으로 바꾸는 흐름을 안내합니다.
          </p>

          <div className="mb-6 overflow-hidden rounded-[10px] border border-line bg-bg-1 text-left">
            <div className="flex items-center justify-between border-b border-line bg-bg-2 px-4 py-2.5">
              <span
                className="font-mono text-text-3"
                style={{ fontSize: 10, letterSpacing: '0.06em' }}
              >
                ATTEMPT · #PQ-FAIL-0428-7721
              </span>
              <span className="h-[7px] w-[7px] rounded-full bg-err" />
            </div>
            <div className="px-[18px] py-4">
              {failedReceipt.map(([label, value], index) => (
                <div
                  key={label}
                  className="flex justify-between py-2"
                  style={{
                    borderBottom:
                      index < failedReceipt.length - 1 ? '1px solid var(--color-line)' : 'none',
                  }}
                >
                  <span className="text-text-3" style={{ fontSize: 12.5 }}>
                    {label}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 12.5,
                      color: label === '거절 사유' ? 'var(--color-err)' : 'var(--color-text-1)',
                    }}
                  >
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
              시도해볼 수 있어요
            </div>
            <div className="flex flex-col gap-1.5">
              {failureSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  className="flex items-center gap-3 rounded-md border border-line bg-bg-1 px-[13px] py-[9px]"
                >
                  <span className="font-mono text-text-4" style={{ fontSize: 11 }}>
                    0{index + 1}
                  </span>
                  <span className="text-text-2" style={{ fontSize: 12.5 }}>
                    {suggestion}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/pricing/success"
              className="inline-flex flex-1 items-center justify-center rounded-md border border-acc bg-acc text-acc-ink hover:brightness-105"
              style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600 }}
            >
              다시 시도
            </Link>
            <Link
              href="/pricing"
              className="inline-flex flex-1 items-center justify-center rounded-md border border-line bg-transparent text-text-1 hover:bg-bg-2"
              style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500 }}
            >
              결제 수단 변경
            </Link>
          </div>

          <div
            className="mt-5 rounded-md border border-line bg-bg-1 px-[14px] py-3 text-left text-text-3"
            style={{ fontSize: 12, lineHeight: 1.5 }}
          >
            계속 실패한다면 support@promptquest.dev 로 문의하는 안내 배너를 노출합니다.
          </div>
        </div>
      </div>
    </div>
  );
}
