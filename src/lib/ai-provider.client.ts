import { normalizeAiProvider } from '@/lib/ai-provider.shared';

export interface ClientAiConfig {
  provider: 'claude' | 'gemini';
  displayName: string;
  modelLabel: string;
}

export function getClientAiConfig(): ClientAiConfig {
  const provider = normalizeAiProvider(process.env.NEXT_PUBLIC_AI_PROVIDER);

  return {
    provider,
    displayName: 'Ai Bot',
    modelLabel: 'Ai Bot',
  };
}
