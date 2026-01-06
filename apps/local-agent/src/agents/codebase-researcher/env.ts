import { z } from 'zod';

const envSchema = z.object({
  /** WebSocket server URL (will be converted from http to ws if needed) */
  SERVER_URL: z
    .string()
    .url()
    .default('ws://localhost:3001')
    .transform((url) => url.replace(/^http/, 'ws')),

  /** Agent ID for logging/identification */
  AGENT_ID: z.string().optional(),

  /** Secret API key from local agent creation */
  AGENT_API_KEY: z.string().min(1, 'AGENT_API_KEY is required'),

  /** Working directory for file operations (defaults to current directory) */
  WORKING_DIRECTORY: z.string().optional(),

  /** Claude model to use (e.g., 'claude-sonnet-4-20250514') */
  MODEL: z.string().optional(),

  /** Maximum tokens for extended thinking mode */
  MAX_THINKING_TOKENS: z.coerce.number().optional(),
});

export const env = envSchema.parse(process.env);
