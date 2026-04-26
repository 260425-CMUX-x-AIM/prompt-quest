const sections = [
  {
    title: '1. 처리 목적',
    body: 'PromptQuest는 세션 진행, 평가 결과 제공, 서비스 품질 개선, 분쟁 대응을 위해 최소한의 데이터를 처리합니다.',
  },
  {
    title: '2. 처리 항목',
    body: '프로필 정보, 태스크 풀이 메시지, 결과물, 토큰 사용량, 평가 메타데이터, 운영 로그가 포함될 수 있습니다.',
  },
  {
    title: '3. 보관 기간',
    body: '프로토타입 단계에서는 서비스 운영과 디버깅에 필요한 기간 동안 데이터를 보관하며, 삭제 요청이나 정책 변경 시 조정될 수 있습니다.',
  },
  {
    title: '4. 제3자 제공',
    body: 'AI 평가와 응답 생성을 위해 모델 제공 사업자에 요청 데이터 일부가 전달될 수 있으며, 범위는 서비스 운영에 필요한 최소 수준으로 제한합니다.',
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-bg-0 text-text-1">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <div className="font-mono text-text-3" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
            LEGAL
          </div>
          <h1 className="mt-2 text-3xl font-semibold">개인정보 처리방침</h1>
          <p className="mt-3 text-text-2" style={{ lineHeight: 1.7 }}>
            본 문서는 MVP 단계의 임시 초안입니다. 실제 출시 전 저장 범위와 보관 정책은 별도 검토를
            거쳐 확정됩니다.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="rounded-xl border border-line bg-bg-1 p-5">
              <h2 className="text-base font-medium">{section.title}</h2>
              <p className="mt-2 text-sm text-text-2" style={{ lineHeight: 1.7 }}>
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
