export type TimeRange = 'today' | 'week' | 'month' | 'all';

/**
 * Default inactivity threshold in minutes.
 * If a user is inactive for longer than this, a new session will be created.
 */
export const DEFAULT_INACTIVITY_THRESHOLD_MINUTES = 30;
