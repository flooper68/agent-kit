import { z } from 'zod';

const envSchema = z.object({
  /** WebSocket server URL (will be converted from http to ws if needed) */
  SERVER_URL: z
    .string()
    .url()
    .default('ws://localhost:3001')
    .transform((url) => url.replace(/^http/, 'ws')),

  /** Agent ID for logging/identification */
  CODER_AGENT_ID: z.string().optional(),

  /** Secret API key from local agent creation */
  CODER_AGENT_API_KEY: z.string().min(1, 'CODER_AGENT_API_KEY is required'),

  /** Git repository URL to clone */
  CODER_GIT_REPOSITORY_URL: z
    .string()
    .min(1, 'CODER_GIT_REPOSITORY_URL is required'),

  /** Git branch to checkout (optional, defaults to default branch) */
  CODER_GIT_BRANCH: z.string().optional(),

  /** Working directory for file operations (defaults to current directory) */
  CODER_WORKING_DIRECTORY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
