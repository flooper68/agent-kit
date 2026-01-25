import type Redis from 'ioredis';
import type { db as DbType } from '../db';
import { eq, and, lte, ne, or, isNull } from 'drizzle-orm';
import { scheduledJobs, type ScheduledJob } from '../db/schema';
import type { AgentSpawner } from '../agent';
import type { ScheduledJobsFeature } from '../features/scheduled-jobs';
import { calculateNextRunAt } from './cron-utils';
import { logger } from '../logger/logger';

const log = logger.child({ module: 'scheduler-service' });

/**
 * Configuration for the scheduler service
 */
export interface SchedulerServiceConfig {
  /** Unique identifier for this server instance */
  instanceId: string;
  /** Interval in milliseconds to poll for due jobs (default: 10000) */
  pollIntervalMs?: number;
  /** TTL for the leader lock in milliseconds (default: 30000) */
  leaderLockTtlMs?: number;
  /** Interval to refresh the leader lock in milliseconds (default: 10000) */
  leaderHeartbeatMs?: number;
}

const DEFAULT_CONFIG = {
  pollIntervalMs: 10_000,
  leaderLockTtlMs: 30_000,
  leaderHeartbeatMs: 10_000,
} as const;

const LEADER_LOCK_KEY = 'scheduler:leader';

/**
 * SchedulerService - Executes scheduled jobs at their cron-defined times
 *
 * Uses Redis for leader election to ensure only one instance polls and executes
 * jobs in a multi-instance deployment.
 */
export class SchedulerService {
  private config: Required<SchedulerServiceConfig>;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isLeader = false;
  private isRunning = false;

  constructor(
    config: SchedulerServiceConfig,
    private redis: Redis,
    private db: typeof DbType,
    private agentSpawner: AgentSpawner,
    private scheduledJobsFeature: ScheduledJobsFeature
  ) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Start the scheduler service
   * Begins leader election and polling for due jobs
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      log.warn('Scheduler service already running');
      return;
    }

    this.isRunning = true;
    log.info('Starting scheduler service', {
      instanceId: this.config.instanceId,
      pollIntervalMs: this.config.pollIntervalMs,
    });

    // Try to acquire leadership immediately
    await this.tryAcquireLeadership();

    // Start the polling loop
    this.pollTimer = setInterval(async () => {
      await this.poll();
    }, this.config.pollIntervalMs);

    // Start the heartbeat loop (for maintaining leadership)
    this.heartbeatTimer = setInterval(async () => {
      await this.refreshLeadership();
    }, this.config.leaderHeartbeatMs);

    log.info('Scheduler service started');
  }

  /**
   * Stop the scheduler service
   * Releases leadership and stops all timers
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    log.info('Stopping scheduler service');

    this.isRunning = false;

    // Clear timers
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Release leadership if we have it
    if (this.isLeader) {
      await this.releaseLeadership();
    }

    log.info('Scheduler service stopped');
  }

  /**
   * Try to acquire the leader lock
   * Uses SET NX EX for atomic lock acquisition
   */
  private async tryAcquireLeadership(): Promise<boolean> {
    try {
      const result = await this.redis.set(
        LEADER_LOCK_KEY,
        this.config.instanceId,
        'PX',
        this.config.leaderLockTtlMs,
        'NX'
      );

      if (result === 'OK') {
        if (!this.isLeader) {
          log.info('Acquired scheduler leadership', {
            instanceId: this.config.instanceId,
          });
        }
        this.isLeader = true;
        return true;
      }

      return false;
    } catch (error) {
      log.error('Error acquiring leadership', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Refresh the leader lock TTL if we still own it
   * Uses Lua script for atomic check-and-extend
   */
  private async refreshLeadership(): Promise<void> {
    if (!this.isLeader) {
      // Try to acquire if we're not the leader
      await this.tryAcquireLeadership();
      return;
    }

    try {
      // Lua script: only extend if we still own the lock
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("pexpire", KEYS[1], ARGV[2])
        end
        return 0
      `;

      const result = await this.redis.eval(
        script,
        1,
        LEADER_LOCK_KEY,
        this.config.instanceId,
        String(this.config.leaderLockTtlMs)
      );

      if (result !== 1) {
        log.warn('Lost scheduler leadership', {
          instanceId: this.config.instanceId,
        });
        this.isLeader = false;
      }
    } catch (error) {
      log.error('Error refreshing leadership', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.isLeader = false;
    }
  }

  /**
   * Release the leader lock
   * Uses Lua script for atomic check-and-delete
   */
  private async releaseLeadership(): Promise<void> {
    try {
      // Lua script: only delete if we own the lock
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        end
        return 0
      `;

      await this.redis.eval(script, 1, LEADER_LOCK_KEY, this.config.instanceId);

      log.info('Released scheduler leadership', {
        instanceId: this.config.instanceId,
      });
      this.isLeader = false;
    } catch (error) {
      log.error('Error releasing leadership', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Poll for due jobs and execute them
   */
  private async poll(): Promise<void> {
    if (!this.isLeader) {
      return;
    }

    try {
      const dueJobs = await this.findDueJobs();

      if (dueJobs.length > 0) {
        log.info('Found due jobs', { count: dueJobs.length });
      }

      for (const job of dueJobs) {
        await this.executeJob(job);
      }
    } catch (error) {
      log.error('Error polling for due jobs', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find jobs that are due to run
   * Queries for enabled jobs where nextRunAt <= now and not currently running
   */
  private async findDueJobs(): Promise<ScheduledJob[]> {
    const now = new Date();

    const jobs = await this.db
      .select()
      .from(scheduledJobs)
      .where(
        and(
          eq(scheduledJobs.enabled, true),
          lte(scheduledJobs.nextRunAt, now),
          // Handle null (never run) or any status other than 'running'
          or(
            isNull(scheduledJobs.lastRunStatus),
            ne(scheduledJobs.lastRunStatus, 'running')
          )
        )
      );

    return jobs;
  }

  /**
   * Execute a scheduled job by spawning an agent
   */
  private async executeJob(job: ScheduledJob): Promise<void> {
    log.info('Executing scheduled job', {
      jobId: job.id,
      jobName: job.name,
      agentId: job.agentId,
    });

    // Mark job as running
    await this.scheduledJobsFeature.update({
      id: job.id,
      userId: job.userId,
      orgId: job.orgId,
      lastRunAt: new Date(),
      lastRunStatus: 'running',
    });

    try {
      // Spawn the agent
      const result = await this.agentSpawner.spawn({
        agentId: job.agentId,
        message: job.message,
        userId: job.userId,
        orgId: job.orgId,
        timeout: job.timeout ?? undefined,
      });

      if (result.dispatched) {
        // Calculate next run time
        const nextRunAt = calculateNextRunAt(job.cronExpression, job.timezone);

        // Update job status
        await this.scheduledJobsFeature.update({
          id: job.id,
          userId: job.userId,
          orgId: job.orgId,
          lastRunStatus: 'success',
          lastSessionId: result.sessionId,
          nextRunAt,
        });

        log.info('Scheduled job executed successfully', {
          jobId: job.id,
          sessionId: result.sessionId,
          nextRunAt: nextRunAt.toISOString(),
        });
      } else {
        // Agent spawn failed but didn't throw
        const nextRunAt = calculateNextRunAt(job.cronExpression, job.timezone);

        await this.scheduledJobsFeature.update({
          id: job.id,
          userId: job.userId,
          orgId: job.orgId,
          lastRunStatus: 'failed',
          nextRunAt,
        });

        log.error('Scheduled job failed to dispatch', {
          jobId: job.id,
          error: result.error,
        });
      }
    } catch (error) {
      // Calculate next run time even on failure
      const nextRunAt = calculateNextRunAt(job.cronExpression, job.timezone);

      // Update job status to failed
      await this.scheduledJobsFeature.update({
        id: job.id,
        userId: job.userId,
        orgId: job.orgId,
        lastRunStatus: 'failed',
        nextRunAt,
      });

      log.error('Scheduled job execution error', {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
