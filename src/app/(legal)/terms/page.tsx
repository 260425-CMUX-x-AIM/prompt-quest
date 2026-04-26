import Link from 'next/link';

// 이용약관. 베타 출시용 최소 사양. 정식 출시 전 법무 검토 필요.
export default function TermsPage() {
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
          이용약관
        </h1>

        <div className="text-text-2" style={{ fontSize: 14, lineHeight: 1.75 }}>
          <p className="mb-6">
            본 약관은 PromptQuest(이하 &ldquo;서비스&rdquo;)를 이용함에 있어 회사와 이용자 간의
            권리·의무 및 책임 사항을 규정합니다. 서비스에 가입(이메일 인증 완료)함으로써 본 약관에
            동의한 것으로 간주됩니다.
          </p>

          <h2 className="font-medium mt-8 mb-3" style={{ fontSize: 16 }}>
            제1조 (서비스의 내용)
          </h2>
          <p className="mb-4">
            서비스는 개발자가 AI 도구를 활용해 실전형 태스크를 풀고 그 결과를 정량적으로 평가하는
            플랫폼입니다. 회사는 사용자가 작성한 프롬프트, AI 응답, 결과물(코드 등), 채점 결과를
            서비스 운영·개선 목적으로 저장·사용합니다.
          </p>

          <h2 className="font-medium mt-8 mb-3" style={{ fontSize: 16 }}>
            제2조 (이용자의 의무)
          </h2>
          <ul className="list-disc pl-5 mb-4 flex flex-col gap-1.5">
            <li>타인의 계정·자료를 무단으로 사용하지 않을 것</li>
            <li>서비스 이용 중 타인의 권리를 침해하거나 법령에 위반되는 행위를 하지 않을 것</li>
            <li>채점 시스템을 의도적으로 우회·교란하는 자동화·악용을 하지 않을 것</li>
          </ul>

          <h2 className="font-medium mt-8 mb-3" style={{ fontSize: 16 }}>
            제3조 (서비스의 변경·중단)
          </h2>
          <p className="mb-4">
            회사는 서비스의 일부 또는 전부를 사전 고지 후 변경하거나 중단할 수 있으며, 점검 등
            운영상 필요한 경우 사전 공지 없이 일시적으로 중단할 수 있습니다.
          </p>

          <h2 className="font-medium mt-8 mb-3" style={{ fontSize: 16 }}>
            제4조 (책임의 제한)
          </h2>
          <p className="mb-4">
            서비스가 제공하는 채점·피드백은 학습 보조 목적이며, 그 결과를 채용·인사 등의 의사결정에
            그대로 사용하는 것을 권장하지 않습니다. AI 응답의 정확성에 대해서는 회사가 별도의 보증을
            하지 않습니다.
          </p>

          <h2 className="font-medium mt-8 mb-3" style={{ fontSize: 16 }}>
            제5조 (약관의 변경)
          </h2>
          <p className="mb-4">
            회사는 필요한 경우 약관을 개정할 수 있으며, 개정 약관은 서비스 내 공지로 효력이
            발생합니다. 사용자는 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 회원 탈퇴를
            요청할 수 있습니다.
          </p>

          <p className="mt-10 text-text-3" style={{ fontSize: 12 }}>
            시행일: 2026년 4월 26일
          </p>
        </div>
      </div>
    </div>
  );
}
