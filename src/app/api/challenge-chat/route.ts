import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { getServerAiConfig } from '@/lib/ai-provider.server';
import { HARD_CODED_CHALLENGE } from '@/lib/challenge';

interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  slug?: string;
  artifact?: string;
  messages?: IncomingMessage[];
}

function buildSystemPrompt(artifact?: string) {
  const artifactSection = artifact?.trim()
    ? `Current artifact:
\`\`\`javascript
${artifact.trim()}
\`\`\`

If you revise the artifact, return the full updated artifact in one fenced code block.`
    : 'There is no artifact yet. If the user asks for a first draft, provide one complete artifact in a fenced code block.';

  return `You are helping a user solve one coding challenge.

Challenge:
- Title: ${HARD_CODED_CHALLENGE.title}
- Scenario: ${HARD_CODED_CHALLENGE.scenario}
- Requirements:
${HARD_CODED_CHALLENGE.requirements.map((item) => `  - ${item.id}: ${item.description}`).join('\n')}
- Output format: ${HARD_CODED_CHALLENGE.outputFormat}

Rules:
- Answer in Korean.
- Be concise and practical.
- When proposing code, prefer JavaScript.
- If you provide or update the solution artifact, include exactly one fenced code block with the full artifact.
- Reference the user's latest request and previous artifact when relevant.

${artifactSection}`;
}

export async function POST(request: Request) {
  const aiConfig = getServerAiConfig();

  if (!aiConfig.apiKey) {
    return NextResponse.json(
      { error: `${aiConfig.apiKeyEnvName}가 설정되지 않았습니다.` },
      { status: 500 },
    );
  }

  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: '요청 본문이 올바른 JSON이 아닙니다.' }, { status: 400 });
  }

  const messages = body.messages?.filter(
    (message): message is IncomingMessage =>
      (message.role === 'user' || message.role === 'assistant') &&
      typeof message.content === 'string' &&
      message.content.trim().length > 0,
  );

  if (!messages?.length) {
    return NextResponse.json({ error: '대화 메시지가 비어 있습니다.' }, { status: 400 });
  }

  try {
    if (aiConfig.provider === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': aiConfig.apiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: buildSystemPrompt(body.artifact) }],
            },
            contents: messages.map((message) => ({
              role: message.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: message.content }],
            })),
            generationConfig: {
              maxOutputTokens: 1400,
            },
          }),
        },
      );

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
        promptFeedback?: {
          blockReason?: string;
        };
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
        };
        modelVersion?: string;
        error?: {
          message?: string;
        };
      };

      if (!response.ok) {
        throw new Error(
          data.error?.message || `${aiConfig.displayName} API 호출 중 오류가 발생했습니다.`,
        );
      }

      if (data.promptFeedback?.blockReason) {
        throw new Error(
          `${aiConfig.displayName}가 요청을 차단했습니다: ${data.promptFeedback.blockReason}`,
        );
      }

      const content = data.candidates
        ?.flatMap((candidate) => candidate.content?.parts ?? [])
        .map((part) => part.text ?? '')
        .join('\n\n')
        .trim();

      if (!content) {
        return NextResponse.json(
          { error: `${aiConfig.displayName} 응답에서 텍스트를 찾지 못했습니다.` },
          { status: 502 },
        );
      }

      return NextResponse.json({
        content,
        model: data.modelVersion || aiConfig.model,
        usage: {
          inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
          outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        },
      });
    }

    const anthropic = new Anthropic({
      apiKey: aiConfig.apiKey,
    });

    const response = await anthropic.messages.create({
      model: aiConfig.model,
      max_tokens: 1400,
      system: buildSystemPrompt(body.artifact),
      messages,
    });

    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n\n')
      .trim();

    if (!content) {
      return NextResponse.json(
        { error: `${aiConfig.displayName} 응답에서 텍스트를 찾지 못했습니다.` },
        { status: 502 },
      );
    }

    return NextResponse.json({
      content,
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : `${aiConfig.displayName} API 호출 중 오류가 발생했습니다.`;

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
