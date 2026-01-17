import { z } from 'zod';

const envSchema = z.object({
  /** WebSocket server URL (will be converted from http to ws if needed) */
  SERVER_URL: z
    .string()
    .url()
    .default('ws://localhost:3001')
    .transform((url) => url.replace(/^http/, 'ws')),

  /** Agent ID for logging/identification */
  CLAUDE_ASSISTANT_OPUS_AGENT_ID: z.string().optional(),

  /** Secret API key from local agent creation */
  CLAUDE_ASSISTANT_OPUS_AGENT_API_KEY: z
    .string()
    .min(1, 'CLAUDE_ASSISTANT_OPUS_AGENT_API_KEY is required'),
});

export const env = envSchema.parse(process.env);
