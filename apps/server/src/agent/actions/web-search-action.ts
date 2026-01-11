import { tool } from 'ai';
import type { Tool } from '../shared/types';
import { getTavilyClient } from '../../lib/tavily';
import { webSearchSchema } from '@agent-kit/shared';

export const webSearchAction: Tool = tool({
  description:
    'Search the web for current information. Use this when you need up-to-date facts, news, or information that may not be in your training data.',
  inputSchema: webSearchSchema,
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
