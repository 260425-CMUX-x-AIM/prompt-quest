const sections = [
  {
    title: '1. 서비스 목적',
    body: 'PromptQuest는 AI와 협업해 과제를 해결하는 과정을 기록하고 평가 결과를 제공하는 프로토타입 서비스입니다.',
  },
  {
    title: '2. 수집 데이터',
    body: '과제 풀이 중 입력한 메시지, 생성된 결과물, 토큰 사용량, 평가 결과와 같은 운영 데이터를 저장할 수 있습니다.',
  },
  {
    title: '3. 이용 제한',
    body: '타인의 권리를 침해하거나 서비스 운영을 방해하는 사용, 자동화된 과도한 요청, 악성 코드 생성 목적의 사용은 제한될 수 있습니다.',
  },
  {
    title: '4. 평가 결과',
    body: '평가 결과는 참고용이며, 운영자는 품질 개선과 분쟁 처리를 위해 평가 기준과 시스템을 조정할 수 있습니다.',
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-bg-0 text-text-1">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <div className="font-mono text-text-3" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
            LEGAL
          </div>
          <h1 className="mt-2 text-3xl font-semibold">이용약관</h1>
          <p className="mt-3 text-text-2" style={{ lineHeight: 1.7 }}>
            본 문서는 MVP 단계의 임시 약관 초안입니다. 실제 출시 전 법률 검토를 거쳐 수정될 수
            있습니다.
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
