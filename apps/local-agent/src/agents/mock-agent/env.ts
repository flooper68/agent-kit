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

  /** Delay between events in milliseconds */
  MOCK_DELAY_MS: z.coerce.number().default(100),

  /** Enable thinking/reasoning events */
  MOCK_THINKING_ENABLED: z
    .string()
    .default('true')
    .transform((val) => val === 'true' || val === '1'),

  /** Number of tool calls to simulate */
  MOCK_TOOL_CALLS: z.coerce.number().default(2),
});

export const env = envSchema.parse(process.env);
