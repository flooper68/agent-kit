import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import { getTavilyClient, TavilyFormatSchema } from '../../../lib/tavily';

export const extractContentMetadata: ActionMetadata = {
  id: 'extractContent',
  requiredScopes: [AgentScope.UTILITIES_EXTRACT],
};

export const extractContentTool: Tool = tool({
  description:
    'Extract the full content from one or more URLs. Use after web search to get complete article text from relevant results.',
  inputSchema: z.object({
    urls: z
      .array(z.string().url())
      .min(1)
      .max(5)
      .describe('URLs to extract content from'),
    format: TavilyFormatSchema.default('markdown').describe(
      'Output format for extracted content'
    ),
  }),
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
