import type { AgentProvider } from '../types';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';

// Provider registry
const providers = new Map<string, AgentProvider>();

// Register built-in providers
providers.set('openai', new OpenAIProvider());
providers.set('gemini', new GeminiProvider());

export function getProvider(id: string): AgentProvider | undefined {
  return providers.get(id);
}

export function registerProvider(provider: AgentProvider): void {
  providers.set(provider.id, provider);
}

export function listProviders(): string[] {
  return Array.from(providers.keys());
}

export { OpenAIProvider, GeminiProvider };
