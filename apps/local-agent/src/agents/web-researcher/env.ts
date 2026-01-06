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

  /** HTTP proxy for web requests */
  HTTP_PROXY: z.string().optional(),

  /** HTTPS proxy for web requests */
  HTTPS_PROXY: z.string().optional(),

  /** Claude model to use (e.g., 'claude-sonnet-4-20250514') */
  MODEL: z.string().optional(),

  /** Maximum tokens for extended thinking mode */
  MAX_THINKING_TOKENS: z.coerce.number().optional(),

  /** Enable partial message streaming for real-time text updates */
  INCLUDE_PARTIAL_MESSAGES: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
});

export const env = envSchema.parse(process.env);
