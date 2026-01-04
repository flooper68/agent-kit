export function formatProvider(provider: string): string {
  const names: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    gemini: 'Google',
    unknown: 'Unknown',
  };
  return names[provider.toLowerCase()] ?? provider;
}
