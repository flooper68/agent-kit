/**
 * Configuration for agent spawning behavior
 */
export const SPAWN_CONFIG = {
  /** Default timeout for spawned agent responses (2 minutes) */
  DEFAULT_TIMEOUT_MS: 120_000,

  /** Maximum spawn depth to prevent infinite recursion */
  MAX_SPAWN_DEPTH: 3,

  /** Minimum allowed timeout (10 seconds) */
  MIN_TIMEOUT_MS: 10_000,

  /** Maximum allowed timeout (10 minutes) */
  MAX_TIMEOUT_MS: 600_000,
} as const;
