export type EvaluationProvider = 'openai' | 'gemini';

export interface JsonCompletionOptions {
  system: string;
  prompt: string;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
  seed?: number;
}

export interface EvaluationProviderConfig {
  provider: EvaluationProvider;
  validatorModel: string;
  judgeModel: string;
  apiKey: string | undefined;
}

function normalizeProvider(value?: string): EvaluationProvider {
  return value === 'gemini' ? 'gemini' : 'openai';
}

export function getEvaluationProviderConfig(): EvaluationProviderConfig {
  const provider = normalizeProvider(process.env.EVALUATION_PROVIDER);

  if (provider === 'gemini') {
    return {
      provider,
      validatorModel:
        process.env.VALIDATOR_MODEL || process.env.GEMINI_EVALUATION_MODEL || 'gemini-2.5-flash',
      judgeModel:
        process.env.JUDGE_MODEL || process.env.GEMINI_EVALUATION_MODEL || 'gemini-2.5-flash',
      apiKey: process.env.GEMINI_API_KEY,
    };
  }

  return {
    provider,
    validatorModel: process.env.VALIDATOR_MODEL || 'gpt-4o-mini',
    judgeModel: process.env.JUDGE_MODEL || 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
  };
}

export function assertEvaluationApiKey(config: EvaluationProviderConfig): string {
  if (!config.apiKey) {
    const envName = config.provider === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY';
    throw new Error(`${envName}가 설정되지 않았습니다.`);
  }

  return config.apiKey;
}

export async function createJsonCompletion<T>(
  config: EvaluationProviderConfig,
  options: JsonCompletionOptions,
): Promise<T> {
  const apiKey = assertEvaluationApiKey(config);

  if (config.provider === 'gemini') {
    return createGeminiJsonCompletion<T>(apiKey, options);
  }

  return createOpenAiJsonCompletion<T>(apiKey, options);
}

async function createOpenAiJsonCompletion<T>(
  apiKey: string,
  options: JsonCompletionOptions,
): Promise<T> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model,
      temperature: options.temperature ?? 0,
      max_tokens: options.maxOutputTokens ?? 1200,
      ...(typeof options.seed === 'number' ? { seed: options.seed } : {}),
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: options.system },
        { role: 'user', content: options.prompt },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI evaluator API 오류 (${response.status})`);
  }

  return parseJsonText<T>(data.choices?.[0]?.message?.content);
}

async function createGeminiJsonCompletion<T>(
  apiKey: string,
  options: JsonCompletionOptions,
): Promise<T> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: options.system }],
        },
        contents: [{ role: 'user', parts: [{ text: options.prompt }] }],
        generationConfig: {
          temperature: options.temperature ?? 0,
          maxOutputTokens: options.maxOutputTokens ?? 1200,
          responseMimeType: 'application/json',
        },
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini evaluator API 오류 (${response.status})`);
  }

  const content = data.candidates
    ?.flatMap(
      (candidate: { content?: { parts?: Array<{ text?: string }> } }) =>
        candidate.content?.parts ?? [],
    )
    .map((part: { text?: string }) => part.text ?? '')
    .join('\n')
    .trim();

  return parseJsonText<T>(content);
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
