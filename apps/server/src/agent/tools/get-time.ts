import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';

export const getTimeTool: Tool = tool({
  description: 'Get the current date and time. Optionally specify a timezone.',
  inputSchema: z.object({
    timezone: z
      .string()
      .optional()
      .describe('IANA timezone (e.g., "America/New_York", "Europe/London")'),
  }),
  execute: async ({ timezone }) => {
    const tz = timezone || 'UTC';
    const date = new Date();

    try {
      const formatted = date.toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'long',
        timeZone: tz,
      });

      return {
        timestamp: date.toISOString(),
        formatted,
        timezone: tz,
      };
    } catch {
      // Invalid timezone fallback
      return {
        timestamp: date.toISOString(),
        formatted: date.toLocaleString('en-US', {
          dateStyle: 'full',
          timeStyle: 'long',
          timeZone: 'UTC',
        }),
        timezone: 'UTC',
        warning: `Invalid timezone "${timezone}", using UTC`,
      };
    }
  },
});
