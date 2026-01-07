import type Redis from 'ioredis';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { logger } from './logger';

const log = logger.child({ module: 'job-queue-manager' });

/**
 * Configuration for job queue behavior
 */
export const JOB_QUEUE_CONFIG = {
  /** Block timeout for XREADGROUP in milliseconds */
  BLOCK_TIMEOUT_MS: 5000,
  /** Block timeout for concurrent consumer in milliseconds */
  CONCURRENT_BLOCK_TIMEOUT_MS: 1000,
  /** Sleep interval when at capacity in milliseconds */
  CAPACITY_CHECK_INTERVAL_MS: 50,
  /** Session lock TTL in milliseconds (10 minutes) */
  SESSION_LOCK_TTL_MS: 600_000,
  /** Maximum backoff delay for retries in milliseconds */
  MAX_BACKOFF_MS: 30_000,
  /** Shutdown grace period in milliseconds (60 seconds) */
  SHUTDOWN_GRACE_PERIOD_MS: 60_000,
  /** Maximum consecutive errors before stopping consumer */
  MAX_CONSECUTIVE_ERRORS: 10,
} as const;

// Zod schema for agent jobs
export const AgentJobSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  agentId: z.string(),
  userId: z.string(),
  orgId: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

export type AgentJob = z.infer<typeof AgentJobSchema>;

export type JobHandler = (job: AgentJob) => Promise<void>;

// Redis key for job stream
const JOB_STREAM = 'agent:jobs';

/**
 * JobQueueManager - Infrastructure manager for Redis job queue operations
 * Handles job enqueueing and consumption using Redis streams with consumer groups
 */
export class JobQueueManager {
  constructor(
    private redis: Redis,
    private workerRedis: Redis
  ) {}

  /**
   * Ensure consumer group exists for job stream
   */
  async ensureConsumerGroup(groupName: string): Promise<void> {
    try {
      log.info('Creating consumer group', { groupName, stream: JOB_STREAM });
      await this.redis.xgroup('CREATE', JOB_STREAM, groupName, '0', 'MKSTREAM');
      log.info('Consumer group created', { groupName });
    } catch (error) {
      // Group already exists - that's fine
      if (
        error instanceof Error &&
        error.message.includes('BUSYGROUP Consumer Group name already exists')
      ) {
        log.info('Consumer group already exists', { groupName });
      } else {
        log.error('Error creating consumer group', {
          groupName,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    }
  }

  /**
   * Enqueue an agent job to the job stream
   */
  async enqueue(job: Omit<AgentJob, 'id' | 'createdAt'>): Promise<string> {
    const fullJob: AgentJob = {
      ...job,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };

    log.info('Enqueuing job', { jobId: fullJob.id, sessionId: job.sessionId });

    try {
      const messageId = await this.redis.xadd(
        JOB_STREAM,
        '*',
        'data',
        JSON.stringify(fullJob)
      );

      log.info('Job enqueued', {
        jobId: fullJob.id,
        messageId: messageId ?? undefined,
      });

      return messageId ?? fullJob.id;
    } catch (error) {
      log.error('Error enqueueing job', {
        jobId: fullJob.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Consume jobs from the job stream using consumer groups
   * This ensures each job is processed by exactly one worker
   * @param signal - Optional AbortSignal for graceful shutdown
   */
  async consume(
    groupName: string,
    consumerName: string,
    handler: JobHandler,
    options: { blockMs?: number; count?: number; signal?: AbortSignal } = {}
  ): Promise<void> {
    const {
      blockMs = JOB_QUEUE_CONFIG.BLOCK_TIMEOUT_MS,
      count = 1,
      signal,
    } = options;

    log.info('Setting up consumer', { groupName, consumerName });

    await this.ensureConsumerGroup(groupName);

    log.info('Consumer ready, starting job consumption', {
      stream: JOB_STREAM,
    });

    let consecutiveErrors = 0;

    while (!signal?.aborted) {
      try {
        // Use dedicated worker connection for blocking operations
        const result = (await this.workerRedis.call(
          'XREADGROUP',
          'GROUP',
          groupName,
          consumerName,
          'BLOCK',
          String(blockMs),
          'COUNT',
          String(count),
          'STREAMS',
          JOB_STREAM,
          '>'
        )) as [string, [string, string[]][]][] | null;

        if (!result) {
          // Timeout - no messages available, continue polling
          continue;
        }

        log.debug('XREADGROUP returned streams', { count: result.length });

        for (const [streamName, messages] of result) {
          log.debug('Processing stream messages', {
            streamName,
            messageCount: messages.length,
          });

          for (const [messageId, fields] of messages) {
            try {
              const dataIndex = fields.indexOf('data');
              if (dataIndex === -1 || dataIndex + 1 >= fields.length) {
                log.warn('Invalid message format', { messageId });
                continue;
              }

              const rawData = fields[dataIndex + 1];
              if (!rawData) {
                log.warn('Empty data field', { messageId });
                continue;
              }

              let job: AgentJob;
              try {
                const parsed = JSON.parse(rawData);
                job = AgentJobSchema.parse(parsed);
              } catch (parseError) {
                log.error('Failed to parse job data', {
                  messageId,
                  error:
                    parseError instanceof Error
                      ? parseError.message
                      : 'Parse error',
                });
                // Acknowledge malformed message to prevent infinite redelivery
                await this.redis.xack(JOB_STREAM, groupName, messageId);
                continue;
              }

              log.info('Processing job', {
                jobId: job.id,
                sessionId: job.sessionId,
                agentId: job.agentId,
              });

              await handler(job);

              log.info('Job completed', { jobId: job.id });

              // Acknowledge the message
              await this.redis.xack(JOB_STREAM, groupName, messageId);
            } catch (error) {
              log.error('Error processing job', {
                messageId,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
              // Don't ack - message will be redelivered
            }
          }
        }

        // Reset error count on successful iteration
        consecutiveErrors = 0;
      } catch (error) {
        consecutiveErrors++;
        log.error('Error consuming jobs', {
          attempt: consecutiveErrors,
          maxAttempts: JOB_QUEUE_CONFIG.MAX_CONSECUTIVE_ERRORS,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        if (consecutiveErrors >= JOB_QUEUE_CONFIG.MAX_CONSECUTIVE_ERRORS) {
          log.error('Max consecutive errors reached, stopping consumer');
          throw new Error(
            `Job consumer stopped after ${JOB_QUEUE_CONFIG.MAX_CONSECUTIVE_ERRORS} consecutive errors`
          );
        }

        // Exponential backoff: 1s, 2s, 4s, 8s, ... up to max
        const delay = Math.min(
          1000 * Math.pow(2, consecutiveErrors - 1),
          JOB_QUEUE_CONFIG.MAX_BACKOFF_MS
        );
        log.info('Retrying after backoff', { delayMs: delay });

        // Wait with abort support
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, delay);
          signal?.addEventListener(
            'abort',
            () => {
              clearTimeout(timeout);
              resolve();
            },
            { once: true }
          );
        });
      }
    }

    if (signal?.aborted) {
      log.info('Consumer stopped via abort signal');
    }
  }

  /**
   * Consume jobs concurrently with per-session locking
   * - Multiple jobs can run in parallel (up to maxConcurrent)
   * - Only ONE job per session can run at a time (Redis lock)
   * - Jobs for locked sessions are re-enqueued for later processing
   */
  async consumeConcurrently(
    groupName: string,
    consumerName: string,
    handler: JobHandler,
    options: { signal?: AbortSignal; maxConcurrent?: number } = {}
  ): Promise<void> {
    const { maxConcurrent = 10, signal } = options;
    const activeJobs = new Set<string>(); // Track active session IDs

    log.info('Setting up concurrent consumer', {
      groupName,
      consumerName,
      maxConcurrent,
    });

    await this.ensureConsumerGroup(groupName);

    log.info('Concurrent consumer ready', { stream: JOB_STREAM });

    let consecutiveErrors = 0;

    while (!signal?.aborted) {
      try {
        // Don't fetch if at capacity
        if (activeJobs.size >= maxConcurrent) {
          await new Promise((r) =>
            setTimeout(r, JOB_QUEUE_CONFIG.CAPACITY_CHECK_INTERVAL_MS)
          );
          continue;
        }

        // Fetch up to remaining capacity
        const fetchCount = maxConcurrent - activeJobs.size;
        const result = (await this.workerRedis.call(
          'XREADGROUP',
          'GROUP',
          groupName,
          consumerName,
          'BLOCK',
          String(JOB_QUEUE_CONFIG.CONCURRENT_BLOCK_TIMEOUT_MS),
          'COUNT',
          String(fetchCount),
          'STREAMS',
          JOB_STREAM,
          '>'
        )) as [string, [string, string[]][]][] | null;

        if (!result) {
          // Timeout - no messages available, continue polling
          continue;
        }

        for (const [, messages] of result) {
          for (const [messageId, fields] of messages) {
            const job = this.parseJob(fields);
            if (!job) {
              // Malformed message - ack to prevent infinite redelivery
              await this.redis.xack(JOB_STREAM, groupName, messageId);
              continue;
            }

            // Try to acquire session lock
            const lockKey = `agent:session:${job.sessionId}:lock`;
            const acquired = await this.redis.set(
              lockKey,
              consumerName,
              'PX',
              JOB_QUEUE_CONFIG.SESSION_LOCK_TTL_MS,
              'NX'
            );

            if (acquired !== 'OK') {
              // Session is busy - re-enqueue the job for later processing
              // ACK the current message and add a new one to the stream
              log.info('Session locked, re-enqueuing job', {
                jobId: job.id,
                sessionId: job.sessionId,
              });
              // Re-add to stream (creates new message ID)
              await this.redis.xadd(
                JOB_STREAM,
                '*',
                'data',
                JSON.stringify(job)
              );
              // ACK the original message to remove it from pending
              await this.redis.xack(JOB_STREAM, groupName, messageId);
              continue;
            }

            log.info('Processing job concurrently', {
              jobId: job.id,
              sessionId: job.sessionId,
              agentId: job.agentId,
              activeJobs: activeJobs.size + 1,
            });

            // Track job and process concurrently
            activeJobs.add(job.sessionId);
            this.processJobWithLock(
              job,
              messageId,
              groupName,
              lockKey,
              consumerName,
              handler,
              activeJobs
            ).catch((error) => {
              log.error('Unhandled error in processJobWithLock', {
                jobId: job.id,
                sessionId: job.sessionId,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            });
          }
        }

        // Reset error count on successful iteration
        consecutiveErrors = 0;
      } catch (error) {
        consecutiveErrors++;
        log.error('Error in concurrent consumer', {
          attempt: consecutiveErrors,
          maxAttempts: JOB_QUEUE_CONFIG.MAX_CONSECUTIVE_ERRORS,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        if (consecutiveErrors >= JOB_QUEUE_CONFIG.MAX_CONSECUTIVE_ERRORS) {
          log.error('Max consecutive errors reached, stopping consumer');
          throw new Error(
            `Job consumer stopped after ${JOB_QUEUE_CONFIG.MAX_CONSECUTIVE_ERRORS} consecutive errors`
          );
        }

        // Exponential backoff
        const delay = Math.min(
          1000 * Math.pow(2, consecutiveErrors - 1),
          JOB_QUEUE_CONFIG.MAX_BACKOFF_MS
        );
        log.info('Retrying after backoff', { delayMs: delay });

        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, delay);
          signal?.addEventListener(
            'abort',
            () => {
              clearTimeout(timeout);
              resolve();
            },
            { once: true }
          );
        });
      }
    }

    // Wait for active jobs to complete before exiting (configurable grace period)
    if (activeJobs.size > 0) {
      log.info('Waiting for active jobs to complete', {
        activeJobs: activeJobs.size,
        gracePeriodMs: JOB_QUEUE_CONFIG.SHUTDOWN_GRACE_PERIOD_MS,
      });

      const startTime = Date.now();
      while (
        activeJobs.size > 0 &&
        Date.now() - startTime < JOB_QUEUE_CONFIG.SHUTDOWN_GRACE_PERIOD_MS
      ) {
        await new Promise((r) => setTimeout(r, 1000));
        log.info('Still waiting for active jobs', {
          activeJobs: activeJobs.size,
        });
      }

      if (activeJobs.size > 0) {
        log.warn('Forcing shutdown with active jobs remaining', {
          activeJobs: activeJobs.size,
        });
      }
    }

    log.info('Concurrent consumer stopped');
  }

  /**
   * Process a job with lock management
   * Ensures activeJobs set is always cleaned up and lock is released
   */
  private async processJobWithLock(
    job: AgentJob,
    messageId: string,
    groupName: string,
    lockKey: string,
    consumerName: string,
    handler: JobHandler,
    activeJobs: Set<string>
  ): Promise<void> {
    try {
      await handler(job);
      await this.redis.xack(JOB_STREAM, groupName, messageId);
      log.info('Job completed', { jobId: job.id, sessionId: job.sessionId });
    } catch (error) {
      log.error('Job failed', {
        jobId: job.id,
        sessionId: job.sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't ack - will be redelivered after lock expires
    } finally {
      // Always clean up activeJobs tracking
      activeJobs.delete(job.sessionId);

      // Release lock only if we still own it (Lua script for atomicity)
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        end
        return 0
      `;
      await this.redis.eval(script, 1, lockKey, consumerName);
    }
  }

  /**
   * Parse job from Redis stream fields
   */
  private parseJob(fields: string[]): AgentJob | null {
    const dataIndex = fields.indexOf('data');
    if (dataIndex === -1 || dataIndex + 1 >= fields.length) {
      log.warn('Invalid message format in job stream');
      return null;
    }

    const rawData = fields[dataIndex + 1];
    if (!rawData) {
      log.warn('Empty data field in job message');
      return null;
    }

    try {
      const parsed = JSON.parse(rawData);
      return AgentJobSchema.parse(parsed);
    } catch (parseError) {
      log.error('Failed to parse job data', {
        error: parseError instanceof Error ? parseError.message : 'Parse error',
      });
      return null;
    }
  }
}
