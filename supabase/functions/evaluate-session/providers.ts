interface JsonCompletionOptions {
  system: string;
  prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  seed?: number;
}

export async function createJsonCompletion<T>({
  system,
  prompt,
  model = Deno.env.get('OPENAI_EVALUATION_MODEL') ?? 'gpt-4o-mini',
  temperature = 0,
  max_tokens = 1200,
  seed,
}: JsonCompletionOptions): Promise<T> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens,
      ...(typeof seed === 'number' ? { seed } : {}),
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI evaluator API 오류 (${response.status})`);
  }

  return parseJsonText<T>(data.choices?.[0]?.message?.content);
}

function parseJsonText<T>(value: unknown): T {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('평가 모델 응답에서 JSON 텍스트를 찾지 못했습니다.');
  }

  const trimmed = value
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/```$/, '')
    .trim();

  return JSON.parse(trimmed) as T;
}
