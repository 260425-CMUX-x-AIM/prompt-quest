export type AiProvider = 'claude' | 'gemini';

export function normalizeAiProvider(value?: string): AiProvider {
  return value === 'gemini' ? 'gemini' : 'claude';
}

export const AI_PROVIDER_META: Record<
  AiProvider,
  {
    displayName: string;
    defaultModelLabel: string;
  }
> = {
  claude: {
    displayName: 'Claude',
    defaultModelLabel: 'claude-sonnet-4-5',
  },
  gemini: {
    displayName: 'Gemini',
    defaultModelLabel: 'gemini-2.5-flash',
  },
};
