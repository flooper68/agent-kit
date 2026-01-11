import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import { getTavilyClient, TavilyTopicSchema } from '../../../lib/tavily';

export const webSearchMetadata: ActionMetadata = {
  id: 'webSearch',
  requiredScopes: [AgentScope.UTILITIES_WEB_SEARCH],
};

export const webSearchTool: Tool = tool({
  description:
    'Search the web for current information. Use this when you need up-to-date facts, news, or information that may not be in your training data.',
  inputSchema: z.object({
    query: z
      .string()
      .min(1, 'Search query cannot be empty')
      .max(500, 'Search query is too long')
      .describe('The search query'),
    maxResults: z
      .number()
      .min(1)
      .max(10)
      .default(5)
      .describe('Maximum number of results to return'),
    topic: TavilyTopicSchema.optional().describe(
      'Topic category to focus the search'
    ),
  }),
  execute: async ({ query, maxResults, topic }) => {
    try {
      const client = getTavilyClient();
      const result = await client.search({
        query,
        max_results: maxResults,
        topic,
        include_answer: true,
      });

      return {
        answer: result.answer,
        results: result.results.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content,
        })),
      };
    } catch (error) {
      return {
        error: 'Web search failed',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
        results: [],
      };
    }
  },
});
