import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessionEvents, artifacts } from '../../../db/schema';

export interface WebsiteResource {
  url: string;
  title: string;
  snippet?: string;
}

export interface ArtifactResource {
  id: string;
  title: string;
  summary: string | null;
  createdAt: Date;
}

export interface SessionResources {
  artifacts: ArtifactResource[];
  websites: WebsiteResource[];
}

interface WebSearchResult {
  url: string;
  title: string;
  snippet?: string;
}

interface WebSearchToolResult {
  results?: WebSearchResult[];
}

interface ExtractContentToolArgs {
  urls?: string[];
}

export class GetSessionResourcesQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(sessionId: string): Promise<SessionResources> {
    // 1. Query artifacts by sessionId
    const sessionArtifacts = await this.db
      .select({
        id: artifacts.id,
        title: artifacts.title,
        summary: artifacts.summary,
        createdAt: artifacts.createdAt,
      })
      .from(artifacts)
      .where(eq(artifacts.sessionId, sessionId))
      .orderBy(artifacts.createdAt);

    // 2. Query webSearch tool_result events for this session
    const webSearchEvents = await this.db
      .select({
        toolResult: agentSessionEvents.toolResult,
      })
      .from(agentSessionEvents)
      .where(
        and(
          eq(agentSessionEvents.sessionId, sessionId),
          eq(agentSessionEvents.type, 'tool_result'),
          eq(agentSessionEvents.toolName, 'webSearch')
        )
      );

    // 3. Query extractContent tool_call events for URLs from toolArgs
    const extractContentEvents = await this.db
      .select({
        toolArgs: agentSessionEvents.toolArgs,
      })
      .from(agentSessionEvents)
      .where(
        and(
          eq(agentSessionEvents.sessionId, sessionId),
          eq(agentSessionEvents.type, 'tool_call'),
          eq(agentSessionEvents.toolName, 'extractContent')
        )
      );

    // 4. Extract and deduplicate websites
    // webSearch results take precedence for title/snippet
    const websiteMap = new Map<string, WebsiteResource>();

    // From webSearch results (these have title and snippet)
    for (const event of webSearchEvents) {
      const result = event.toolResult as WebSearchToolResult | null;
      if (result?.results) {
        for (const item of result.results) {
          if (item.url && !websiteMap.has(item.url)) {
            websiteMap.set(item.url, {
              url: item.url,
              title: item.title,
              snippet: item.snippet,
            });
          }
        }
      }
    }

    // From extractContent args (add if not already present from webSearch)
    for (const event of extractContentEvents) {
      const args = event.toolArgs as ExtractContentToolArgs | null;
      if (args?.urls) {
        for (const url of args.urls) {
          if (!websiteMap.has(url)) {
            // Extract domain as fallback title
            let title = url;
            try {
              const urlObj = new URL(url);
              title = urlObj.hostname;
            } catch {
              // Keep full URL as title if parsing fails
            }
            websiteMap.set(url, { url, title });
          }
        }
      }
    }

    return {
      artifacts: sessionArtifacts,
      websites: Array.from(websiteMap.values()),
    };
  }
}
