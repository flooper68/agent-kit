import { tool } from 'ai';
import type { Tool } from '../shared/types';
import { getTavilyClient } from '../../lib/tavily';
import { extractContentSchema } from '@agent-kit/shared';

export const extractContentAction: Tool = tool({
  description:
    'Extract the full content from one or more URLs. Use after web search to get complete article text from relevant results.',
  inputSchema: extractContentSchema,
  execute: async ({ urls, format }) => {
    try {
      const client = getTavilyClient();
      const result = await client.extract({ urls, format });

      return {
        results: result.results.map((r) => ({
          url: r.url,
          content: r.raw_content,
        })),
        failed: result.failed_results ?? [],
      };
    } catch (error) {
      return {
        error: 'Content extraction failed',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
        results: [],
        failed: urls.map((url) => ({
          url,
          error: 'Extraction failed',
        })),
      };
    }
  },
});
