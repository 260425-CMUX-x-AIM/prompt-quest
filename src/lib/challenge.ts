export interface ChallengeRequirement {
  id: string;
  description: string;
}

export interface ChallengeTestCase {
  id: string;
  type: 'positive' | 'negative' | 'edge';
  input: string;
  expected: string;
}

export interface ChallengeDefinition {
  title: string;
  scenario: string;
  outputFormat: string;
  starterArtifact: string;
  requirements: ChallengeRequirement[];
  testCases: ChallengeTestCase[];
}

export interface CodeBlock {
  language: string;
  content: string;
}

export const HARD_CODED_CHALLENGE: ChallengeDefinition = {
  title: '이메일 추출 정규식 작성',
  scenario:
    '로그 텍스트에서 이메일 주소만 정확히 추출하는 JavaScript 정규식을 만들어야 합니다. AI와 대화하며 요구사항을 정리하고, 결과물 패널에 최종 산출물을 쌓아가세요.',
  outputFormat: `const EMAIL_REGEX = /YOUR_PATTERN/g;`,
  starterArtifact: `const EMAIL_REGEX = // TODO: build with Claude

const sample = "Contact: alice@example.com or bob@sub.test.org";
console.log(sample.match(EMAIL_REGEX));`,
  requirements: [
    { id: 'req-1', description: '유효한 이메일 형식만 매칭해야 합니다.' },
    { id: 'req-2', description: '도메인 부분에는 점이 최소 1개 있어야 합니다.' },
    { id: 'req-3', description: 'ReDoS에 취약한 패턴은 피해야 합니다.' },
  ],
  testCases: [
    {
      id: 'tc-1',
      type: 'positive',
      input: '"Contact: alice@example.com or bob@sub.test.org"',
      expected: '["alice@example.com", "bob@sub.test.org"]',
    },
    {
      id: 'tc-2',
      type: 'negative',
      input: '"Invalid: not-an-email, @missing.com"',
      expected: '[]',
    },
    {
      id: 'tc-3',
      type: 'edge',
      input: '"Edge: a@b.c, very.long+tag@co.uk"',
      expected: '["a@b.c", "very.long+tag@co.uk"]',
    },
  ],
};

export function extractCodeBlocks(content: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const regex = /```([\w-]+)?\n([\s\S]*?)```/g;

  let match = regex.exec(content);
  while (match) {
    blocks.push({
      language: match[1]?.trim() || 'text',
      content: match[2].trim(),
    });
    match = regex.exec(content);
  }

  return blocks;
}

export function stripCodeBlocks(content: string): string {
  return content.replace(/```[\w-]*\n[\s\S]*?```/g, '').trim();
}
