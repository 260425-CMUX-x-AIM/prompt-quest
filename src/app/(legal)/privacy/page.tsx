import Link from 'next/link';

// 개인정보처리방침. 베타 출시용 최소 사양. 정식 출시 전 법무 검토 필요.
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-0 text-text-1">
      <div className="max-w-[760px] mx-auto" style={{ padding: '40px 28px 80px' }}>
        <Link
          href="/login"
          className="font-mono text-text-3 hover:text-text-2 mb-6 inline-block"
          style={{ fontSize: 11 }}
        >
          ← 돌아가기
        </Link>

        <h1 className="font-medium mb-8" style={{ fontSize: 28 }}>
          개인정보처리방침
        </h1>

        <div className="text-text-2" style={{ fontSize: 14, lineHeight: 1.75 }}>
          <p className="mb-6">
            PromptQuest(이하 &ldquo;서비스&rdquo;)는 개인정보 보호법, 정보통신망 이용촉진 및
            정보보호 등에 관한 법률 등 관련 법령을 준수하며, 이용자의 개인정보를 다음과 같이
            수집·이용·보관합니다.
          </p>

          <h2 className="font-medium mt-8 mb-3" style={{ fontSize: 16 }}>
            1. 수집하는 개인정보
          </h2>
          <ul className="list-disc pl-5 mb-4 flex flex-col gap-1.5">
            <li>
              <span className="font-mono text-text-1" style={{ fontSize: 12.5 }}>
                이메일
              </span>{' '}
              — 회원가입·로그인(OTP), 서비스 공지
            </li>
            <li>자동 생성 사용자 ID, 닉네임(이메일 로컬파트 기반)</li>
            <li>서비스 이용 기록: 세션·메시지·결과물·채점 결과</li>
            <li>접속 로그, IP, 브라우저 정보 (보안 모니터링 한정)</li>
          </ul>

          <h2 className="font-medium mt-8 mb-3" style={{ fontSize: 16 }}>
            2. 이용 목적
          </h2>
          <ul className="list-disc pl-5 mb-4 flex flex-col gap-1.5">
            <li>인증 및 계정 관리</li>
            <li>채점·피드백 산출 및 사용자 경험 개선</li>
            <li>오·남용 모니터링 및 보안 사고 대응</li>
            <li>익명화된 통계 분석 (개별 식별 불가)</li>
          </ul>

          <h2 className="font-medium mt-8 mb-3" style={{ fontSize: 16 }}>
            3. 보관 기간
          </h2>
          <p className="mb-4">
            회원 탈퇴 즉시 개인정보는 지체 없이 파기합니다. 다만, 관계 법령에 따라 보존이 필요한
            경우 해당 기간 동안 별도로 분리 보관합니다.
          </p>

          <h2 className="font-medium mt-8 mb-3" style={{ fontSize: 16 }}>
            4. 제3자 제공·처리위탁
          </h2>
          <ul className="list-disc pl-5 mb-4 flex flex-col gap-1.5">
            <li>Supabase Inc. — 인증·DB·서버리스 함수 호스팅</li>
            <li>Anthropic, OpenAI — AI 응답·채점 처리 (사용자 입력 텍스트가 전송됨)</li>
            <li>Vercel Inc. — 웹 호스팅</li>
          </ul>
          <p className="mb-4 text-text-3" style={{ fontSize: 12.5 }}>
            각 처리자는 GDPR / 한국 개인정보보호법 호환 데이터 처리 부속서(DPA)를 체결한
            사업자입니다.
          </p>

          <h2 className="font-medium mt-8 mb-3" style={{ fontSize: 16 }}>
            5. 이용자의 권리
          </h2>
          <p className="mb-4">
            이용자는 언제든 본인 정보의 열람·정정·삭제·처리 정지를 요구할 수 있습니다. 마이 페이지의
            계정 설정 또는 아래 문의처를 통해 행사 가능합니다.
          </p>

          <h2 className="font-medium mt-8 mb-3" style={{ fontSize: 16 }}>
            6. 문의
          </h2>
          <p className="mb-4">
            개인정보 관련 문의:{' '}
            <span className="font-mono text-text-1" style={{ fontSize: 12.5 }}>
              privacy@promptquest.app
            </span>
          </p>

          <p className="mt-10 text-text-3" style={{ fontSize: 12 }}>
            시행일: 2026년 4월 26일
          </p>
        </div>
      </div>
    </div>
  );
}
