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

  /** Working directory for CLI execution (defaults to current directory) */
  WORKING_DIRECTORY: z.string().optional(),

  /** Claude model to use (e.g., 'claude-sonnet-4-20250514', 'sonnet', 'opus') */
  MODEL: z.string().optional(),

  /** Maximum tokens for extended thinking mode */
  MAX_THINKING_TOKENS: z.coerce.number().optional(),

  /** Maximum output tokens */
  MAX_TOKENS: z.coerce.number().optional(),

  /** Comma-separated list of tools to auto-approve */
  ALLOWED_TOOLS: z.string().optional(),

  /** Comma-separated list of tools to block */
  DISALLOWED_TOOLS: z.string().optional(),

  /** Custom system prompt to append */
  APPEND_SYSTEM_PROMPT: z.string().optional(),

  /**
   * Permission mode for handling tool approvals (REQUIRED).
   * - 'allowed-tools': Only auto-approve tools listed in ALLOWED_TOOLS (recommended)
   * - 'dangerously-skip-permissions': Skip all permission prompts (use only in trusted environments)
   */
  PERMISSION_MODE: z.enum(['dangerously-skip-permissions', 'allowed-tools'], {
    message:
      'PERMISSION_MODE is required. Set to "allowed-tools" for controlled access or "dangerously-skip-permissions" for full access.',
  }),
});

export const env = envSchema.parse(process.env);

/**
 * Parse comma-separated string to array, filtering empty values.
 */
export function parseToolsList(
  tools: string | undefined
): string[] | undefined {
  if (!tools) return undefined;
  const parsed = tools
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : undefined;
}
