/**
 * Spawn configuration constants - shared between server and local-agent
 * These are the default values; server allows env var overrides.
 */
export const SPAWN_DEFAULTS = {
  /** Default timeout for spawned agent responses (15 minutes) */
  DEFAULT_TIMEOUT_MS: 900_000,
  /** Maximum spawn depth to prevent infinite recursion */
  MAX_SPAWN_DEPTH: 3,
  /** Minimum allowed timeout (10 seconds) */
  MIN_TIMEOUT_MS: 10_000,
  /** Maximum allowed timeout (60 minutes) */
  MAX_TIMEOUT_MS: 3_600_000,
} as const;
