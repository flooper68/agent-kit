import type Redis from 'ioredis';

// Redis keys for job registry
const ACTIVE_JOBS_KEY = 'agent:active-jobs';
const INTERRUPT_REQUESTS_KEY = 'agent:interrupt-requests';

/**
 * JobRegistryManager - Infrastructure manager for tracking active jobs and handling interrupts
 * Manages the registry of which workers are processing which sessions
 */
export class JobRegistryManager {
  constructor(private redis: Redis) {}

  /**
   * Register that a worker is processing a job for a session
   */
  async register(sessionId: string, workerId: string): Promise<void> {
    await this.redis.hset(ACTIVE_JOBS_KEY, sessionId, workerId);
  }

  /**
   * Unregister a job when it's complete
   */
  async unregister(sessionId: string): Promise<void> {
    await this.redis
      .multi()
      .hdel(ACTIVE_JOBS_KEY, sessionId)
      .hdel(INTERRUPT_REQUESTS_KEY, sessionId)
      .exec();
  }

  /**
   * Check if a session has an active job
   */
  async hasActive(sessionId: string): Promise<boolean> {
    const workerId = await this.redis.hget(ACTIVE_JOBS_KEY, sessionId);
    return workerId !== null;
  }

  /**
   * Get all session IDs with active jobs
   * Returns a Set for efficient lookup when enriching session lists
   */
  async getActiveSessionIds(): Promise<Set<string>> {
    const activeJobs = await this.redis.hgetall(ACTIVE_JOBS_KEY);
    return new Set(Object.keys(activeJobs));
  }

  /**
   * Request interruption of an active job
   * Returns true if there was an active job to interrupt
   */
  async requestInterrupt(sessionId: string): Promise<boolean> {
    const hasJob = await this.hasActive(sessionId);
    if (!hasJob) {
      return false;
    }

    await this.redis.hset(INTERRUPT_REQUESTS_KEY, sessionId, '1');
    return true;
  }

  /**
   * Check if an interrupt has been requested for a session
   */
  async isInterrupted(sessionId: string): Promise<boolean> {
    const interrupted = await this.redis.hget(
      INTERRUPT_REQUESTS_KEY,
      sessionId
    );
    return interrupted === '1';
  }
}
