import { HARD_CODED_CHALLENGES } from '@/lib/challenge';

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

const TASK_STATS: Record<string, Pick<Task, 'attempts' | 'completion' | 'completed' | 'locked'>> = {
  'regex-email-001': { completed: 'best:92', attempts: 423, completion: 0.74 },
  'debug-async-001': { completed: 'best:78', attempts: 312, completion: 0.81 },
  'review-pr-001': { completed: null, attempts: 198, completion: 0.65 },
  'debug-date-001': { completed: null, attempts: 126, completion: 0.68 },
  'regex-log-redact-001': { completed: null, attempts: 144, completion: 0.71 },
  'debug-null-state-001': { completed: null, attempts: 118, completion: 0.69 },
  'review-rate-limit-001': { completed: null, attempts: 104, completion: 0.57 },
  'component-pagination-001': { completed: 'best:84', attempts: 256, completion: 0.58 },
  'algo-sort-001': { completed: null, attempts: 187, completion: 0.62 },
  'api-design-001': { completed: null, attempts: 142, completion: 0.51 },
  'test-mock-001': { completed: null, attempts: 98, completion: 0.55 },
  'component-command-palette-001': { completed: null, attempts: 91, completion: 0.49 },
  'algo-rate-limit-001': { completed: null, attempts: 84, completion: 0.46 },
  'test-contract-001': { completed: null, attempts: 76, completion: 0.44 },
  'arch-event-001': { completed: null, attempts: 43, completion: 0.32, locked: true },
  'refactor-legacy-001': { completed: null, attempts: 67, completion: 0.41 },
  'security-xss-001': { completed: null, attempts: 51, completion: 0.38, locked: true },
  'perf-react-001': { completed: null, attempts: 39, completion: 0.36, locked: true },
  'security-ssrf-001': { completed: null, attempts: 34, completion: 0.31, locked: true },
  'perf-sql-001': { completed: null, attempts: 29, completion: 0.29, locked: true },
  'arch-multitenant-001': { completed: null, attempts: 22, completion: 0.27, locked: true },
};

function getTaskStats(challenge: (typeof HARD_CODED_CHALLENGES)[number]) {
  const fallback = {
    easy: { completed: null, attempts: 86, completion: 0.67 },
    medium: { completed: null, attempts: 54, completion: 0.46 },
    hard: { completed: null, attempts: 21, completion: 0.28, locked: true },
  } satisfies Record<Task['diff'], Pick<Task, 'attempts' | 'completion' | 'completed' | 'locked'>>;

  return TASK_STATS[challenge.slug] ?? fallback[challenge.difficulty];
}

export const ALL_TASKS: Task[] = HARD_CODED_CHALLENGES.map((challenge) => {
  const stats = getTaskStats(challenge);

  return {
    slug: challenge.slug,
    title: challenge.title,
    cat: challenge.category,
    diff: challenge.difficulty,
    mins: challenge.estimatedMinutes,
    completed: stats.completed,
    attempts: stats.attempts,
    completion: stats.completion,
    locked: stats.locked,
  };
});

export const CATEGORIES = [...new Set(ALL_TASKS.map((task) => task.cat))] as string[];

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
