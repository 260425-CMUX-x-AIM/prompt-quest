import { AI_PROVIDER_META, normalizeAiProvider, type AiProvider } from '@/lib/ai-provider.shared';

export interface ServerAiConfig {
  provider: AiProvider;
  displayName: string;
  model: string;
  apiKey: string | undefined;
  apiKeyEnvName: 'ANTHROPIC_API_KEY' | 'GEMINI_API_KEY';
}

export function getServerAiConfig(): ServerAiConfig {
  const provider = normalizeAiProvider(
    process.env.AI_PROVIDER ?? process.env.NEXT_PUBLIC_AI_PROVIDER,
  );

  if (provider === 'gemini') {
    return {
      provider,
      displayName: AI_PROVIDER_META[provider].displayName,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      apiKey: process.env.GEMINI_API_KEY,
      apiKeyEnvName: 'GEMINI_API_KEY',
    };
  }

  return {
    provider,
    displayName: AI_PROVIDER_META[provider].displayName,
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    apiKey: process.env.ANTHROPIC_API_KEY,
    apiKeyEnvName: 'ANTHROPIC_API_KEY',
  };
}
