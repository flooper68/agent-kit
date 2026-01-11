import { SPAWN_DEFAULTS } from '@agent-kit/shared';

/**
 * Parse an environment variable as an integer with a default fallback
 */
function parseEnvInt(envVar: string | undefined, defaultValue: number): number {
  if (!envVar) return defaultValue;
  const parsed = parseInt(envVar, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Configuration for agent spawning behavior
 * Default values come from @agent-kit/shared for consistency with local-agent.
 * All values can be overridden via environment variables.
 */
export const SPAWN_CONFIG = {
  /** Default timeout for spawned agent responses (15 minutes) */
  DEFAULT_TIMEOUT_MS: parseEnvInt(
    process.env.SPAWN_DEFAULT_TIMEOUT_MS,
    SPAWN_DEFAULTS.DEFAULT_TIMEOUT_MS
  ),

  /** Maximum spawn depth to prevent infinite recursion */
  MAX_SPAWN_DEPTH: parseEnvInt(
    process.env.SPAWN_MAX_DEPTH,
    SPAWN_DEFAULTS.MAX_SPAWN_DEPTH
  ),

  /** Minimum allowed timeout (10 seconds) */
  MIN_TIMEOUT_MS: parseEnvInt(
    process.env.SPAWN_MIN_TIMEOUT_MS,
    SPAWN_DEFAULTS.MIN_TIMEOUT_MS
  ),

  /** Maximum allowed timeout (60 minutes) */
  MAX_TIMEOUT_MS: parseEnvInt(
    process.env.SPAWN_MAX_TIMEOUT_MS,
    SPAWN_DEFAULTS.MAX_TIMEOUT_MS
  ),
} as const;
