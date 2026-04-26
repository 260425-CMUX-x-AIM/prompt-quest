// 챌린지 흐름 공통 유틸. Day 5 의 메시지 라우트와 챌린지 UI 양쪽에서 사용.
// 사양: docs/06-api-endpoints.md §6.1.

import type { CodeBlock } from '@/lib/types/session';
import type { TaskDefinition } from '@/lib/types/task';

// AI 응답 텍스트에서 ```lang ... ``` 블록을 추출. id 는 임시 (서버 측에서 재발급 가능).
export function extractCodeBlocks(text: string): CodeBlock[] {
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: CodeBlock[] = [];
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    const content = match[2].trimEnd();
    blocks.push({
      id: `blk-${Date.now()}-${i++}`,
      language: match[1] || 'plaintext',
      content,
      line_count: content.split('\n').length,
    });
  }
  return blocks;
}

// Claude 시스템 프롬프트. 태스크 메타데이터·요구사항을 포함.
export function buildSystemPrompt(taskDef: TaskDefinition): string {
  const requirements = taskDef.requirements.map((r) => `- ${r.description}`).join('\n');
  return `당신은 개발자가 풀고 있는 다음 태스크를 돕는 AI 어시스턴트입니다.

[태스크]
${taskDef.metadata.title}

[배경]
${taskDef.context.background}

[요구사항]
${requirements}

사용자의 질문에 답하고 코드를 작성하세요. 코드는 \`\`\`언어 블록으로 감싸 주세요.`;
}
