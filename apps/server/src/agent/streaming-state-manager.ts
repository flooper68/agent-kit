import type Redis from 'ioredis';
import type { CacheInvalidationService } from '../real-time/cache-invalidation-service';
import { logger } from './logger';

const log = logger.child({ module: 'streaming-state-manager' });

// Redis key pattern for streaming state
const STREAMING_STATE_KEY = (sessionId: string) =>
  `streaming:session:${sessionId}`;

// TTL for streaming state - auto-cleanup for crashed workers/agents
const STREAMING_TTL_SECONDS = 300; // 5 minutes

// Heartbeat interval recommendation (for callers)
export const STREAMING_HEARTBEAT_INTERVAL_MS = 60000; // 1 minute

export interface StreamingState {
  sessionId: string;
  userId: string;
  agentId: string;
  isLocalAgent: boolean;
  startedAt: string;
  lastHeartbeat: string;
}

/**
 * StreamingStateManager - Manages streaming state in Redis with TTL
 *
 * Provides a reliable source of truth for which sessions are actively streaming.
 * Works for both server agents and local agents.
 *
 * Features:
 * - Redis storage with TTL for automatic cleanup on crashes
 * - Pub/sub notifications when streaming starts/stops
 * - Heartbeat mechanism to extend TTL during long streams
 * - Query methods for client recovery
 */
export class StreamingStateManager {
  constructor(
    private redis: Redis,
    private cacheInvalidation: CacheInvalidationService
  ) {}

  /**
   * Mark a session as actively streaming
   * Called when an agent job starts processing
   */
  async startStreaming(
    sessionId: string,
    userId: string,
    agentId: string,
    isLocalAgent: boolean
  ): Promise<void> {
    const now = new Date().toISOString();
    const state: StreamingState = {
      sessionId,
      userId,
      agentId,
      isLocalAgent,
      startedAt: now,
      lastHeartbeat: now,
    };

    const key = STREAMING_STATE_KEY(sessionId);

    // Set state with TTL
    await this.redis.setex(key, STREAMING_TTL_SECONDS, JSON.stringify(state));

    // Publish streaming state change event
    await this.cacheInvalidation.publishStreamingStateChanged(
      userId,
      sessionId,
      true
    );

    log.info('Started streaming for session', {
      sessionId,
      agentId,
      isLocalAgent,
    });
  }

  /**
   * Send heartbeat to extend TTL during streaming
   * Should be called periodically (every 60s recommended) during long streams
   */
  async sendHeartbeat(sessionId: string): Promise<boolean> {
    const key = STREAMING_STATE_KEY(sessionId);

    // Get current state
    const data = await this.redis.get(key);
    if (!data) {
      // State doesn't exist (expired or never started)
      return false;
    }

    try {
      const state: StreamingState = JSON.parse(data);
      state.lastHeartbeat = new Date().toISOString();

      // Update state and refresh TTL
      await this.redis.setex(key, STREAMING_TTL_SECONDS, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Mark streaming as stopped
   * Called when agent job completes, errors, or is interrupted
   */
  async stopStreaming(sessionId: string): Promise<void> {
    const key = STREAMING_STATE_KEY(sessionId);

    // Get state to retrieve userId for event publishing
    const data = await this.redis.get(key);
    if (!data) {
      // Already stopped or expired
      return;
    }

    let userId: string | undefined;
    try {
      const state: StreamingState = JSON.parse(data);
      userId = state.userId;
    } catch {
      // Invalid state, just delete it
    }

    // Delete the state
    await this.redis.del(key);

    // Publish streaming state change event
    if (userId) {
      await this.cacheInvalidation.publishStreamingStateChanged(
        userId,
        sessionId,
        false
      );
    }

    log.info('Stopped streaming for session', { sessionId });
  }

  /**
   * Check if a session is currently streaming
   */
  async isStreaming(sessionId: string): Promise<boolean> {
    const key = STREAMING_STATE_KEY(sessionId);
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  /**
   * Get all session IDs that are currently streaming
   * Used by sessions.list to add streaming status to session list
   * Uses SCAN instead of KEYS to avoid blocking Redis
   */
  async getActiveSessionIds(): Promise<Set<string>> {
    const pattern = 'streaming:session:*';
    const sessionIds = new Set<string>();

    // Use SCAN for production-safe iteration (O(1) per iteration vs O(n) for KEYS)
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      for (const key of keys) {
        // Extract sessionId from key: "streaming:session:{sessionId}"
        const sessionId = key.replace('streaming:session:', '');
        sessionIds.add(sessionId);
      }
    } while (cursor !== '0');

    return sessionIds;
  }

  /**
   * Get full streaming state for a session
   */
  async getStreamingState(sessionId: string): Promise<StreamingState | null> {
    const key = STREAMING_STATE_KEY(sessionId);
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as StreamingState;
    } catch {
      return null;
    }
  }

  /**
   * Get all streaming sessions for a user
   * Uses SCAN to iterate through keys without blocking Redis
   */
  async getStreamingSessionsForUser(userId: string): Promise<StreamingState[]> {
    const pattern = 'streaming:session:*';
    const states: StreamingState[] = [];

    // Use SCAN for production-safe iteration
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        const values = await this.redis.mget(keys);
        for (const data of values) {
          if (!data) continue;
          try {
            const state: StreamingState = JSON.parse(data);
            if (state.userId === userId) {
              states.push(state);
            }
          } catch {
            // Skip invalid entries
          }
        }
      }
    } while (cursor !== '0');

    return states;
  }

  /**
   * Cleanup stale streaming states
   * This is a backup mechanism - TTL should handle most cases
   * Call periodically (e.g., every minute) to clean up any edge cases
   */
  async cleanupStale(): Promise<number> {
    // With Redis TTL, keys auto-expire after STREAMING_TTL_SECONDS
    // This method exists for explicit cleanup if needed
    // Currently just returns 0 as TTL handles expiration
    return 0;
  }
}
