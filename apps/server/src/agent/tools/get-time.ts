import { z } from 'zod';
import { tool } from 'ai';
import type { Tool } from '../types';

const getTimeParameters = z.object({
  timezone: z
    .string()
    .optional()
    .describe('IANA timezone (e.g., "America/New_York", "Europe/London")'),
});

type GetTimeParams = z.infer<typeof getTimeParameters>;

async function executeGetTime(args: GetTimeParams) {
  const tz = args.timezone || 'UTC';
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
      warning: `Invalid timezone "${args.timezone}", using UTC`,
    };
  }
}

export const getTimeTool: Tool = tool({
  description: 'Get the current date and time. Optionally specify a timezone.',
  parameters: getTimeParameters,
  execute: executeGetTime,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any);
