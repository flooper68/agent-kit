import { env } from '../../env';
import type {
  TavilySearchInput,
  TavilySearchResponse,
  TavilyExtractInput,
  TavilyExtractResponse,
} from './types';

export class TavilyClient {
  private apiKey: string;
  private baseUrl = 'https://api.tavily.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(input: TavilySearchInput): Promise<TavilySearchResponse> {
    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      throw new Error(`Tavily search failed (${response.status}): ${error}`);
    }

    return response.json() as Promise<TavilySearchResponse>;
  }

  async extract(input: TavilyExtractInput): Promise<TavilyExtractResponse> {
    const response = await fetch(`${this.baseUrl}/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      throw new Error(`Tavily extract failed (${response.status}): ${error}`);
    }

    return response.json() as Promise<TavilyExtractResponse>;
  }
}

// Singleton instance
let client: TavilyClient | null = null;

/**
 * Get or create Tavily client singleton
 */
export function getTavilyClient(): TavilyClient {
  if (!client) {
    client = new TavilyClient(env.TAVILY_API_KEY);
  }
  return client;
}
