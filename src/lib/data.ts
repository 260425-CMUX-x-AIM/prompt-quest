export interface Task {
  slug: string;
  title: string;
  cat: string;
  diff: 'easy' | 'medium' | 'hard';
  mins: number;
  completed: string | null;
  attempts: number;
  completion: number;
  locked?: boolean;
}

export const ALL_TASKS: Task[] = [
  {
    slug: 'regex-email-001',
    title: '이메일 추출 정규식 작성',
    cat: 'regex',
    diff: 'easy',
    mins: 5,
    completed: 'best:92',
    attempts: 423,
    completion: 0.74,
  },
  {
    slug: 'debug-async-001',
    title: 'Promise 체이닝 버그 수정',
    cat: 'debug',
    diff: 'easy',
    mins: 6,
    completed: 'best:78',
    attempts: 312,
    completion: 0.81,
  },
  {
    slug: 'review-pr-001',
    title: '신규 API PR 코드 리뷰',
    cat: 'review',
    diff: 'easy',
    mins: 8,
    completed: null,
    attempts: 198,
    completion: 0.65,
  },
  {
    slug: 'component-pagination-001',
    title: 'React 페이지네이션 컴포넌트',
    cat: 'component',
    diff: 'medium',
    mins: 15,
    completed: 'best:84',
    attempts: 256,
    completion: 0.58,
  },
  {
    slug: 'algo-sort-001',
    title: '객체 배열 다중 키 정렬',
    cat: 'algo',
    diff: 'medium',
    mins: 12,
    completed: null,
    attempts: 187,
    completion: 0.62,
  },
  {
    slug: 'api-design-001',
    title: 'REST API 리소스 설계',
    cat: 'api_design',
    diff: 'medium',
    mins: 18,
    completed: null,
    attempts: 142,
    completion: 0.51,
  },
  {
    slug: 'test-mock-001',
    title: 'Jest mock 전략 수립',
    cat: 'test',
    diff: 'medium',
    mins: 14,
    completed: null,
    attempts: 98,
    completion: 0.55,
  },
  {
    slug: 'arch-event-001',
    title: '이벤트 드리븐 아키텍처',
    cat: 'arch',
    diff: 'hard',
    mins: 35,
    completed: null,
    attempts: 43,
    completion: 0.32,
    locked: true,
  },
  {
    slug: 'refactor-legacy-001',
    title: '콜백 헬을 async/await로',
    cat: 'refactor',
    diff: 'hard',
    mins: 28,
    completed: null,
    attempts: 67,
    completion: 0.41,
  },
  {
    slug: 'security-xss-001',
    title: 'XSS 취약점 진단',
    cat: 'security',
    diff: 'hard',
    mins: 30,
    completed: null,
    attempts: 51,
    completion: 0.38,
    locked: true,
  },
  {
    slug: 'perf-react-001',
    title: 'React 렌더링 병목 분석',
    cat: 'perf',
    diff: 'hard',
    mins: 32,
    completed: null,
    attempts: 39,
    completion: 0.36,
    locked: true,
  },
];

export const CATEGORIES = [
  'regex',
  'debug',
  'review',
  'component',
  'algo',
  'api_design',
  'test',
  'arch',
  'refactor',
  'security',
  'perf',
] as const;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  tokens: number;
  code?: { lang: string; content: string };
  explain?: string;
}

export const SAMPLE_MESSAGES: ChatMessage[] = [
  {
    role: 'user',
    content:
      '이메일 추출 정규식이 필요해. 로컬파트@도메인 형태고, 도메인에는 점이 최소 1개 있어야 해. ReDoS 안전한 패턴으로.',
    tokens: 58,
  },
  {
    role: 'assistant',
    content: `요구사항을 정리하면:
• 로컬파트@도메인 구조
• 도메인에 dot 최소 1개
• ReDoS 안전 (catastrophic backtracking 회피)

아래 패턴을 제안합니다. 가능한 한 quantifier 중첩을 피하고 character class를 명시적으로 제한했습니다.`,
    tokens: 142,
    code: {
      lang: 'javascript',
      content: `const EMAIL_REGEX = /\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b/g;`,
    },
    explain:
      '`+` 사용 시 좌·우가 겹치는 character class를 두지 않아 backtracking이 폭주하지 않습니다.',
  },
  {
    role: 'user',
    content: 'edge case에서 `a@b.c`도 매칭돼야 해. 위 패턴은 TLD 2자 미만이라 빠질 거 같은데?',
    tokens: 31,
  },
  {
    role: 'assistant',
    content:
      'TLD 길이 제약을 1자까지 허용하도록 완화하겠습니다. 다만 그러면 잘못된 매치 위험이 커지니 word boundary는 유지합니다.',
    tokens: 96,
    code: {
      lang: 'javascript',
      content: `const EMAIL_REGEX = /\\b[A-Za-z0-9._%+\\-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\\.[A-Za-z]+\\b/g;`,
    },
  },
];

export const HISTORY = [
  {
    date: '04-25',
    task: '이메일 추출 정규식',
    cat: 'regex',
    diff: 'easy' as const,
    score: 87,
    attempts: 1,
    time: '07:42',
    tokens: 1234,
  },
  {
    date: '04-24',
    task: '객체 배열 다중 키 정렬',
    cat: 'algo',
    diff: 'medium' as const,
    score: 72,
    attempts: 2,
    time: '14:08',
    tokens: 2891,
  },
  {
    date: '04-23',
    task: 'Promise 체이닝 버그',
    cat: 'debug',
    diff: 'easy' as const,
    score: 91,
    attempts: 1,
    time: '04:15',
    tokens: 612,
  },
  {
    date: '04-22',
    task: 'React 페이지네이션',
    cat: 'component',
    diff: 'medium' as const,
    score: 65,
    attempts: 3,
    time: '21:30',
    tokens: 4422,
  },
  {
    date: '04-21',
    task: '신규 API PR 리뷰',
    cat: 'review',
    diff: 'easy' as const,
    score: null as number | null,
    attempts: 0,
    time: '02:11',
    tokens: 401,
    abandoned: true,
  },
  {
    date: '04-20',
    task: 'Jest mock 전략',
    cat: 'test',
    diff: 'medium' as const,
    score: 78,
    attempts: 2,
    time: '12:45',
    tokens: 2103,
  },
  {
    date: '04-19',
    task: 'REST API 리소스 설계',
    cat: 'api_design',
    diff: 'medium' as const,
    score: 81,
    attempts: 1,
    time: '16:22',
    tokens: 3210,
  },
];
