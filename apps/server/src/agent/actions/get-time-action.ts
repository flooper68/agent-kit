import { tool } from 'ai';
import type { Tool } from '../shared/types';
import { getTimeSchema } from '@agent-kit/shared';

export const getTimeAction: Tool = tool({
  description: 'Get the current date and time. Optionally specify a timezone.',
  inputSchema: getTimeSchema,
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
