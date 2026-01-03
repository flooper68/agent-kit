import { env } from '../../env';
import {
  TavilySearchResponseSchema,
  TavilyExtractResponseSchema,
  type TavilySearchInput,
  type TavilySearchResponse,
  type TavilyExtractInput,
  type TavilyExtractResponse,
} from './types';

const REQUEST_TIMEOUT_MS = 30000;

function getSanitizedError(status: number, context: string): Error {
  if (status === 401 || status === 403) {
    return new Error(`${context} authentication failed`);
  }
  if (status === 429) {
    return new Error(`${context} rate limit exceeded. Please try again later.`);
  }
  if (status >= 500) {
    return new Error(`${context} service temporarily unavailable`);
  }
  return new Error(`${context} failed with status ${status}`);
}

export class TavilyClient {
  private apiKey: string;
  private baseUrl = 'https://api.tavily.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(input: TavilySearchInput): Promise<TavilySearchResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        console.error(
          `Tavily search failed (${response.status}): ${errorBody}`
        );
        throw getSanitizedError(response.status, 'Web search');
      }

      const json = await response.json();
      const parsed = TavilySearchResponseSchema.safeParse(json);

      if (!parsed.success) {
        console.error('Invalid Tavily search response:', parsed.error.message);
        throw new Error('Web search returned an invalid response');
      }

      return parsed.data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Web search request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async extract(input: TavilyExtractInput): Promise<TavilyExtractResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        console.error(
          `Tavily extract failed (${response.status}): ${errorBody}`
        );
        throw getSanitizedError(response.status, 'Content extraction');
      }

      const json = await response.json();
      const parsed = TavilyExtractResponseSchema.safeParse(json);

      if (!parsed.success) {
        console.error('Invalid Tavily extract response:', parsed.error.message);
        throw new Error('Content extraction returned an invalid response');
      }

      return parsed.data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Content extraction request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
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

/**
 * Reset the Tavily client singleton (for testing and API key rotation)
 */
export function resetTavilyClient(): void {
  client = null;
}
