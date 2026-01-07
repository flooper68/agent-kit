import type Redis from 'ioredis';
import { z } from 'zod';
import { randomUUID } from 'crypto';

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
      console.log(
        `[JobQueueManager] Creating consumer group: ${groupName} for stream: ${JOB_STREAM}`
      );
      await this.redis.xgroup('CREATE', JOB_STREAM, groupName, '0', 'MKSTREAM');
      console.log(`[JobQueueManager] Consumer group ${groupName} created`);
    } catch (error) {
      // Group already exists - that's fine
      if (
        error instanceof Error &&
        error.message.includes('BUSYGROUP Consumer Group name already exists')
      ) {
        console.log(
          `[JobQueueManager] Consumer group ${groupName} already exists`
        );
      } else {
        console.error(
          `[JobQueueManager] Error creating consumer group:`,
          error
        );
        throw error;
      }
    }
  }

  /**
   * Enqueue an agent job to the job stream
   */
  async enqueue(job: Omit<AgentJob, 'id' | 'createdAt'>): Promise<string> {
    const startTime = Date.now();
    const fullJob: AgentJob = {
      ...job,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };

    console.log(
      `[JobQueueManager] Enqueuing job: ${fullJob.id} at ${startTime}`
    );

    try {
      const messageId = await this.redis.xadd(
        JOB_STREAM,
        '*',
        'data',
        JSON.stringify(fullJob)
      );

      console.log(
        `[JobQueueManager] Job enqueued, Redis messageId: ${messageId}`
      );

      return messageId ?? fullJob.id;
    } catch (error) {
      console.error('[JobQueueManager] Error enqueueing job:', error);
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
    const { blockMs = 5000, count = 1, signal } = options;

    console.log(
      `[JobQueueManager] Setting up consumer group: ${groupName}, consumer: ${consumerName}`
    );

    await this.ensureConsumerGroup(groupName);

    console.log(
      `[JobQueueManager] Consumer group ready, starting to consume jobs from ${JOB_STREAM}`
    );

    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 10;

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

        console.log(
          `[JobQueueManager] XREADGROUP returned ${result.length} stream(s)`
        );

        for (const [streamName, messages] of result) {
          console.log(
            `[JobQueueManager] Stream ${streamName} has ${messages.length} message(s)`
          );

          for (const [messageId, fields] of messages) {
            try {
              const dataIndex = fields.indexOf('data');
              if (dataIndex === -1 || dataIndex + 1 >= fields.length) {
                console.warn(
                  `[JobQueueManager] Invalid message format, fields:`,
                  fields
                );
                continue;
              }

              const rawData = fields[dataIndex + 1];
              if (!rawData) {
                console.warn(`[JobQueueManager] Empty data field`);
                continue;
              }

              let job: AgentJob;
              try {
                const parsed = JSON.parse(rawData);
                job = AgentJobSchema.parse(parsed);
              } catch (parseError) {
                console.error(
                  '[JobQueueManager] Failed to parse job data:',
                  parseError,
                  { messageId, rawData: rawData.slice(0, 200) }
                );
                // Acknowledge malformed message to prevent infinite redelivery
                await this.redis.xack(JOB_STREAM, groupName, messageId);
                continue;
              }

              console.log('[JobQueueManager] Processing job:', job.id, {
                sessionId: job.sessionId,
                agentId: job.agentId,
              });

              await handler(job);

              console.log('[JobQueueManager] Job completed:', job.id);

              // Acknowledge the message
              await this.redis.xack(JOB_STREAM, groupName, messageId);
            } catch (error) {
              console.error('[JobQueueManager] Error processing job:', error);
              // Don't ack - message will be redelivered
            }
          }
        }

        // Reset error count on successful iteration
        consecutiveErrors = 0;
      } catch (error) {
        consecutiveErrors++;
        console.error(
          `[JobQueueManager] Error consuming jobs (attempt ${consecutiveErrors}/${maxConsecutiveErrors}):`,
          error
        );

        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error(
            '[JobQueueManager] Max consecutive errors reached, stopping consumer'
          );
          throw new Error(
            `Job consumer stopped after ${maxConsecutiveErrors} consecutive errors`
          );
        }

        // Exponential backoff: 1s, 2s, 4s, 8s, ... up to 30s max
        const delay = Math.min(
          1000 * Math.pow(2, consecutiveErrors - 1),
          30000
        );
        console.log(`[JobQueueManager] Retrying in ${delay}ms...`);

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
      console.log('[JobQueueManager] Consumer stopped via abort signal');
    }
  }

  /**
   * Consume jobs concurrently with per-session locking
   * - Multiple jobs can run in parallel (up to maxConcurrent)
   * - Only ONE job per session can run at a time (Redis lock)
   * - Jobs for locked sessions are skipped and redelivered later
   */
  async consumeConcurrently(
    groupName: string,
    consumerName: string,
    handler: JobHandler,
    options: { signal?: AbortSignal; maxConcurrent?: number } = {}
  ): Promise<void> {
    const { maxConcurrent = 10, signal } = options;
    const activeJobs = new Set<string>(); // Track active session IDs

    console.log(
      `[JobQueueManager] Setting up concurrent consumer: ${groupName}, consumer: ${consumerName}, maxConcurrent: ${maxConcurrent}`
    );

    await this.ensureConsumerGroup(groupName);

    console.log(
      `[JobQueueManager] Consumer group ready, starting concurrent consumption from ${JOB_STREAM}`
    );

    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 10;

    while (!signal?.aborted) {
      try {
        // Don't fetch if at capacity
        if (activeJobs.size >= maxConcurrent) {
          await new Promise((r) => setTimeout(r, 50));
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
          '1000',
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

            // Try to acquire session lock (5 min TTL for safety)
            const lockKey = `agent:session:${job.sessionId}:lock`;
            const acquired = await this.redis.set(
              lockKey,
              consumerName,
              'PX',
              300000,
              'NX'
            );

            if (acquired !== 'OK') {
              // Session is busy - don't ack, message will be redelivered
              console.log(
                `[JobQueueManager] Session ${job.sessionId} is locked, skipping job ${job.id}`
              );
              continue;
            }

            console.log(
              `[JobQueueManager] Processing job concurrently: ${job.id}`,
              {
                sessionId: job.sessionId,
                agentId: job.agentId,
                activeJobs: activeJobs.size + 1,
              }
            );

            // Process concurrently (don't await)
            activeJobs.add(job.sessionId);
            this.processJobWithLock(
              job,
              messageId,
              groupName,
              lockKey,
              consumerName,
              handler
            ).finally(() => {
              activeJobs.delete(job.sessionId);
            });
          }
        }

        // Reset error count on successful iteration
        consecutiveErrors = 0;
      } catch (error) {
        consecutiveErrors++;
        console.error(
          `[JobQueueManager] Error in concurrent consumer (attempt ${consecutiveErrors}/${maxConsecutiveErrors}):`,
          error
        );

        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error(
            '[JobQueueManager] Max consecutive errors reached, stopping consumer'
          );
          throw new Error(
            `Job consumer stopped after ${maxConsecutiveErrors} consecutive errors`
          );
        }

        // Exponential backoff
        const delay = Math.min(
          1000 * Math.pow(2, consecutiveErrors - 1),
          30000
        );
        console.log(`[JobQueueManager] Retrying in ${delay}ms...`);

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

    // Wait for active jobs to complete before exiting
    if (activeJobs.size > 0) {
      console.log(
        `[JobQueueManager] Waiting for ${activeJobs.size} active jobs to complete...`
      );
      // Give active jobs a grace period to complete
      await new Promise((r) => setTimeout(r, 5000));
    }

    console.log('[JobQueueManager] Concurrent consumer stopped');
  }

  /**
   * Process a job with lock management
   */
  private async processJobWithLock(
    job: AgentJob,
    messageId: string,
    groupName: string,
    lockKey: string,
    consumerName: string,
    handler: JobHandler
  ): Promise<void> {
    try {
      await handler(job);
      await this.redis.xack(JOB_STREAM, groupName, messageId);
      console.log(`[JobQueueManager] Job completed: ${job.id}`);
    } catch (error) {
      console.error(`[JobQueueManager] Job failed: ${job.id}`, error);
      // Don't ack - will be redelivered after lock expires
    } finally {
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
      console.warn(`[JobQueueManager] Invalid message format, fields:`, fields);
      return null;
    }

    const rawData = fields[dataIndex + 1];
    if (!rawData) {
      console.warn(`[JobQueueManager] Empty data field`);
      return null;
    }

    try {
      const parsed = JSON.parse(rawData);
      return AgentJobSchema.parse(parsed);
    } catch (parseError) {
      console.error('[JobQueueManager] Failed to parse job data:', parseError, {
        rawData: rawData.slice(0, 200),
      });
      return null;
    }
  }
}
