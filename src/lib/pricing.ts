export type BillingCycle = 'monthly' | 'yearly';

export type PricingFeature = {
  text: string;
  note?: string;
  disabled?: boolean;
};

export type PricingPlan = {
  name: string;
  tagline: string;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyPeriod: string;
  yearlyPeriod: string;
  features: PricingFeature[];
  ctaLabel: string;
  ctaHref: string;
  highlight?: boolean;
  badge?: string;
};

export const YEARLY_DISCOUNT = '20%';

export const individualPlans: PricingPlan[] = [
  {
    name: 'FREE · 체험',
    tagline: '감을 잡기에 충분한 무료 플랜',
    monthlyPrice: '₩0',
    yearlyPrice: '₩0',
    monthlyPeriod: '/forever',
    yearlyPeriod: '/forever',
    ctaLabel: '지금 시작하기',
    ctaHref: '/tasks',
    features: [
      { text: '1일 3개 태스크' },
      { text: 'Easy 난이도 전체' },
      { text: '기본 채점 (Validator + Quant)' },
      { text: 'Judge 채점', disabled: true, note: '정성 평가 제외' },
      { text: '히스토리 7일 보관' },
    ],
  },
  {
    name: 'PRO · 개인',
    tagline: '진지하게 훈련하는 개발자를 위한 플랜',
    monthlyPrice: '₩19,000',
    yearlyPrice: '₩15,200',
    monthlyPeriod: '/월',
    yearlyPeriod: '/월 · 연간 결제',
    ctaLabel: '14일 무료로 시작',
    ctaHref: '/pricing/success',
    highlight: true,
    badge: 'MOST POPULAR',
    features: [
      { text: '무제한 태스크' },
      { text: 'Easy · Medium · Hard 전체 해금' },
      { text: '4단계 채점 풀 파이프라인' },
      { text: 'AI 모델 선택 (Sonnet/Opus/GPT)' },
      { text: '히스토리 영구 보관' },
      { text: '주간 스킬 리포트 이메일' },
    ],
  },
  {
    name: 'MASTER',
    tagline: '전 카테고리 마스터를 노리는 분',
    monthlyPrice: '₩49,000',
    yearlyPrice: '₩39,200',
    monthlyPeriod: '/월',
    yearlyPeriod: '/월 · 연간 결제',
    ctaLabel: 'MASTER 시작하기',
    ctaHref: '/pricing/success',
    features: [
      { text: 'PRO의 모든 기능' },
      { text: '베타 태스크 사전 액세스' },
      { text: '커스텀 태스크 작성 (개인용)' },
      { text: '월 1:1 멘토 리뷰' },
      { text: '리더보드 인증 배지' },
      { text: '전 모델 우선 큐' },
    ],
  },
];

export const teamPlans: PricingPlan[] = [
  {
    name: 'TEAM · 스타트업',
    tagline: '5-50명 규모 개발팀에 적합',
    monthlyPrice: '₩14,000',
    yearlyPrice: '₩11,200',
    monthlyPeriod: '/석/월',
    yearlyPeriod: '/석/월 · 연간 결제',
    ctaLabel: '14일 무료 트라이얼',
    ctaHref: '/pricing/success',
    highlight: true,
    badge: '가장 인기',
    features: [
      { text: 'PRO 개인 기능 전체' },
      { text: '팀 대시보드 (점수·진행률)' },
      { text: '주간 팀 리포트' },
      { text: '카테고리별 스킬 갭 분석' },
      { text: 'Slack/Teams 연동' },
      { text: '월간 미팅 1회', disabled: true },
    ],
  },
  {
    name: 'BUSINESS · 성장기업',
    tagline: '50-500명 · 부서별 운영',
    monthlyPrice: '₩28,000',
    yearlyPrice: '₩22,400',
    monthlyPeriod: '/석/월',
    yearlyPeriod: '/석/월 · 연간 결제',
    ctaLabel: '영업팀 문의',
    ctaHref: '/pricing/business',
    features: [
      { text: 'TEAM의 모든 기능' },
      { text: '부서·직군별 워크스페이스' },
      { text: 'SSO (SAML, OIDC)' },
      { text: '커스텀 태스크 라이브러리' },
      { text: '온보딩 평가 템플릿' },
      { text: '전담 CSM 지원' },
    ],
  },
  {
    name: 'ENTERPRISE',
    tagline: '500명 이상 · 보안·컴플라이언스 요구',
    monthlyPrice: 'Custom',
    yearlyPrice: 'Custom',
    monthlyPeriod: '',
    yearlyPeriod: '',
    ctaLabel: '견적 문의',
    ctaHref: '/pricing/business',
    features: [
      { text: 'BUSINESS의 모든 기능' },
      { text: 'On-premise / VPC 배포 옵션' },
      { text: 'ISO 27001 · SOC 2 보고서' },
      { text: '데이터 격리 · 감사 로그' },
      { text: 'SLA 99.95% 보장' },
      { text: 'API · LMS 연동' },
    ],
  },
];

export const pricingFaqs = [
  {
    question: '트라이얼 중에 결제되나요?',
    answer: '아니요. 14일 후 자동 갱신 전 이메일로 안내합니다.',
  },
  {
    question: '언제든 플랜 변경 가능한가요?',
    answer: '네, 데모 기준으로 즉시 변경되며 실제 결제 연동은 아직 붙지 않았습니다.',
  },
  {
    question: '세금계산서 발급되나요?',
    answer: 'PRO 이상 플랜에서 가능하다는 가정의 UI입니다. 실제 발급 플로우는 미구현입니다.',
  },
  {
    question: '교육 할인도 제공하나요?',
    answer: '학생 인증 시 할인 코드를 제공하는 방향의 카피를 유지했습니다.',
  },
];

export const teamFeatureHighlights = [
  {
    id: '01',
    title: '팀 대시보드',
    description: '구성원별 점수와 강점·약점을 카테고리별로 한눈에 확인합니다.',
  },
  {
    id: '02',
    title: '온보딩 평가',
    description: '신입의 AI 활용 능력을 입사 첫 주에 측정하고 학습 트랙을 제안합니다.',
  },
  {
    id: '03',
    title: 'SSO · 보안',
    description: 'SAML/OIDC 통합과 감사 로그, 데이터 격리를 위한 엔터프라이즈 요구를 반영합니다.',
  },
  {
    id: '04',
    title: '커스텀 태스크',
    description: '팀의 기술 스택과 도메인에 맞는 실전형 태스크를 라이브러리로 운영합니다.',
  },
  {
    id: '05',
    title: 'Slack 연동',
    description: '주간 리포트와 챌린지 결과를 Slack으로 자동 전달하는 흐름을 보여줍니다.',
  },
  {
    id: '06',
    title: 'API · LMS',
    description: '채점 결과를 사내 LMS나 HR 시스템에 연결하는 확장 방향을 안내합니다.',
  },
];

export const successReceipt = [
  ['플랜', 'PRO · 개인'],
  ['결제 금액', '₩182,400'],
  ['결제 주기', '연간 (20% 할인 적용)'],
  ['결제 수단', 'Visa **** 4242'],
  ['다음 청구일', '2027-04-26'],
  ['이메일', 'kim.dev@example.com'],
] as const;

export const failedReceipt = [
  ['플랜', 'PRO · 개인 (연간)'],
  ['결제 시도 금액', '₩182,400'],
  ['결제 수단', 'Visa **** 4242'],
  ['거절 사유', 'insufficient_funds'],
  ['시도 시각', '2026-04-26 14:32 KST'],
] as const;

export const successNextSteps = [
  '잠겨 있던 Hard 난이도 태스크 도전하기',
  '주간 스킬 리포트 이메일 알림 설정하기',
  'AI 모델 선호도 설정하기',
];

export const failureSuggestions = [
  '카드 한도와 잔액을 확인하세요.',
  '카드사에 해외/온라인 결제 차단 여부를 문의하세요.',
  '다른 결제 수단으로 다시 시도해보세요.',
];
