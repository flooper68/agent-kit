import type Redis from 'ioredis';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import type { AgentsFeature } from '../features/agents';
import type { ArtifactsFeature } from '../features/artifacts';
import type { ProjectsFeature } from '../features/projects';
import type { TasksFeature } from '../features/tasks';
import type {
  MessageWithParts,
  AgentSessionMessageStatus,
  AgentSessionMessageMetadata,
  NewAgentSessionEvent,
} from '../features/agents';

// Zod schemas for type-safe parsing
const StreamEventTypeSchema = z.enum([
  'user_message_created',
  'message_start',
  'text_delta',
  'reasoning_delta',
  'tool_call_start',
  'tool_call_args_delta',
  'tool_result',
  'message_complete',
  'error',
  'interrupted',
  'client_tool_request',
]);

const BaseStreamEventSchema = z.object({
  id: z.string(),
  type: StreamEventTypeSchema,
  sessionId: z.string(),
  messageId: z.string(),
  timestamp: z.string(),
});

const UserMessageCreatedEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('user_message_created'),
  content: z.string(),
});

const MessageStartEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('message_start'),
});

const TextDeltaEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('text_delta'),
  delta: z.string(),
});

const ReasoningDeltaEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('reasoning_delta'),
  delta: z.string(),
});

const ToolCallStartEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('tool_call_start'),
  toolCallId: z.string(),
  toolName: z.string(),
});

const ToolCallArgsDeltaEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('tool_call_args_delta'),
  toolCallId: z.string(),
  delta: z.string(),
});

const ToolResultEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('tool_result'),
  toolCallId: z.string(),
  result: z.unknown(),
  isError: z.boolean().optional(),
});

const MessageCompleteEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('message_complete'),
  usage: z
    .object({
      promptTokens: z.number(),
      completionTokens: z.number(),
      estimatedCost: z.number().optional(),
    })
    .optional(),
  finishReason: z.string().optional(),
});

const ErrorEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('error'),
  error: z.string(),
  code: z.string().optional(),
  retryable: z.boolean().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

const InterruptedEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('interrupted'),
});

const ClientToolRequestEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('client_tool_request'),
  toolName: z.string().min(1),
  requestId: z.string().uuid(),
  params: z.record(z.string(), z.unknown()),
  requiresResponse: z.boolean(),
});

export const StreamEventSchema = z.discriminatedUnion('type', [
  UserMessageCreatedEventSchema,
  MessageStartEventSchema,
  TextDeltaEventSchema,
  ReasoningDeltaEventSchema,
  ToolCallStartEventSchema,
  ToolCallArgsDeltaEventSchema,
  ToolResultEventSchema,
  MessageCompleteEventSchema,
  ErrorEventSchema,
  InterruptedEventSchema,
  ClientToolRequestEventSchema,
]);

export type StreamEvent = z.infer<typeof StreamEventSchema>;

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

// Redis keys
const JOB_STREAM = 'agent:jobs';
const ACTIVE_JOBS_KEY = 'agent:active-jobs';
const INTERRUPT_REQUESTS_KEY = 'agent:interrupt-requests';
const getSessionStream = (sessionId: string) =>
  `agent:session:${sessionId}:events`;

/**
 * AgentSessionManager - manages agent session lifecycle, job queues, and event streams
 * Combines job queue management, interrupt handling, event streaming, and database operations
 */
export type RedisConnectionFactory = () => Redis;

export class AgentSessionManager {
  private redis: Redis;
  private workerRedis: Redis;
  private createSubscriptionConnection: RedisConnectionFactory;
  private agentsFeature: AgentsFeature;
  private _artifactsFeature: ArtifactsFeature;
  private _projectsFeature?: ProjectsFeature;
  private _tasksFeature?: TasksFeature;

  constructor(
    redis: Redis,
    agentsFeature: AgentsFeature,
    artifactsFeature: ArtifactsFeature,
    workerRedis?: Redis,
    createSubscriptionConnection?: RedisConnectionFactory,
    projectsFeature?: ProjectsFeature,
    tasksFeature?: TasksFeature
  ) {
    this.redis = redis;
    // Use dedicated worker connection for blocking XREADGROUP operations
    this.workerRedis = workerRedis ?? redis;
    // Factory to create per-subscription connections for blocking XREAD operations
    // Each subscription gets its own connection to avoid blocking contention
    this.createSubscriptionConnection =
      createSubscriptionConnection ?? (() => redis);
    this.agentsFeature = agentsFeature;
    this._artifactsFeature = artifactsFeature;
    this._projectsFeature = projectsFeature;
    this._tasksFeature = tasksFeature;
  }

  // ============= Agent Access =============

  /**
   * Get agents feature for accessing agent definitions
   */
  get agents() {
    return this.agentsFeature.agents;
  }

  /**
   * Get artifacts feature for tool context
   */
  get artifactsFeature() {
    return this._artifactsFeature;
  }

  /**
   * Get projects feature for tool context
   */
  get projectsFeature() {
    return this._projectsFeature;
  }

  /**
   * Get tasks feature for tool context
   */
  get tasksFeature() {
    return this._tasksFeature;
  }

  // ============= Message Operations =============

  /**
   * Send a message to a session - enqueues job for processing
   */
  async sendMessage(
    sessionId: string,
    agentId: string,
    userId: string,
    orgId: string,
    content: string
  ): Promise<void> {
    // Just enqueue job - message creation happens in job handler
    await this.enqueueJob({
      sessionId,
      agentId,
      userId,
      orgId,
      content,
    });
  }

  /**
   * Get messages for a session with parts reconstructed from events
   */
  async getSessionMessages(sessionId: string): Promise<MessageWithParts[]> {
    return this.agentsFeature.messages.getBySessionId(sessionId);
  }

  /**
   * Insert an agent session event
   */
  async insertEvent(event: NewAgentSessionEvent): Promise<void> {
    await this.agentsFeature.events.insert(event);
  }

  /**
   * Update message status
   */
  async updateMessageStatus(
    messageId: string,
    status: AgentSessionMessageStatus,
    metadata?: AgentSessionMessageMetadata
  ): Promise<void> {
    await this.agentsFeature.messages.updateStatus({
      messageId,
      status,
      metadata,
    });
  }

  /**
   * Create a new message
   */
  async createMessage(input: {
    sessionId: string;
    role: 'user' | 'assistant';
    status: AgentSessionMessageStatus;
  }): Promise<{ id: string }> {
    return this.agentsFeature.messages.create(input);
  }

  /**
   * Update session timestamp
   */
  async updateSessionTimestamp(sessionId: string): Promise<void> {
    await this.agentsFeature.sessions.updateTimestamp(sessionId);
  }

  /**
   * Increment message count for a session
   * Returns the new count for threshold checking
   */
  async incrementMessageCount(sessionId: string): Promise<number | undefined> {
    const result =
      await this.agentsFeature.sessions.incrementMessageCount(sessionId);
    return result?.messageCount;
  }

  /**
   * Update session title and description
   */
  async updateSessionSummary(
    sessionId: string,
    title: string,
    description: string
  ): Promise<void> {
    await this.agentsFeature.sessions.updateSummary({
      sessionId,
      title,
      description,
    });
  }

  /**
   * Update session usage metrics
   */
  async updateSessionUsage(input: {
    sessionId: string;
    promptTokens: number;
    completionTokens: number;
    latency?: number;
    model?: string;
    provider?: string;
  }): Promise<void> {
    await this.agentsFeature.sessions.updateUsage(input);
  }

  // ============= Job Queue Methods =============

  /**
   * Ensure consumer group exists for job stream
   */
  async ensureJobConsumerGroup(groupName: string): Promise<void> {
    try {
      console.log(
        `[AgentSessionManager] Creating consumer group: ${groupName} for stream: ${JOB_STREAM}`
      );
      await this.redis.xgroup('CREATE', JOB_STREAM, groupName, '0', 'MKSTREAM');
      console.log(`[AgentSessionManager] Consumer group ${groupName} created`);
    } catch (error) {
      // Group already exists - that's fine
      if (
        error instanceof Error &&
        error.message.includes('BUSYGROUP Consumer Group name already exists')
      ) {
        console.log(
          `[AgentSessionManager] Consumer group ${groupName} already exists`
        );
      } else {
        console.error(
          `[AgentSessionManager] Error creating consumer group:`,
          error
        );
        throw error;
      }
    }
  }

  /**
   * Enqueue an agent job to the job stream
   */
  async enqueueJob(job: Omit<AgentJob, 'id' | 'createdAt'>): Promise<string> {
    const startTime = Date.now();
    const fullJob: AgentJob = {
      ...job,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };

    console.log(
      `[AgentSessionManager] Enqueuing job: ${fullJob.id} at ${startTime}`
    );

    try {
      const messageId = await this.redis.xadd(
        JOB_STREAM,
        '*',
        'data',
        JSON.stringify(fullJob)
      );

      console.log(
        `[AgentSessionManager] Job enqueued, Redis messageId: ${messageId}`
      );

      return messageId ?? fullJob.id;
    } catch (error) {
      console.error('[AgentSessionManager] Error enqueueing job:', error);
      throw error;
    }
  }

  /**
   * Consume jobs from the job stream using consumer groups
   * This ensures each job is processed by exactly one worker
   */
  async consumeJobs(
    groupName: string,
    consumerName: string,
    handler: JobHandler,
    options: { blockMs?: number; count?: number } = {}
  ): Promise<void> {
    const { blockMs = 5000, count = 1 } = options;

    console.log(
      `[AgentSessionManager] Setting up consumer group: ${groupName}, consumer: ${consumerName}`
    );

    await this.ensureJobConsumerGroup(groupName);

    console.log(
      `[AgentSessionManager] Consumer group ready, starting to consume jobs from ${JOB_STREAM}`
    );

    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 10;

    while (true) {
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
          `[AgentSessionManager] XREADGROUP returned ${result.length} stream(s)`
        );

        for (const [streamName, messages] of result) {
          console.log(
            `[AgentSessionManager] Stream ${streamName} has ${messages.length} message(s)`
          );

          for (const [messageId, fields] of messages) {
            try {
              const dataIndex = fields.indexOf('data');
              if (dataIndex === -1 || dataIndex + 1 >= fields.length) {
                console.warn(
                  `[AgentSessionManager] Invalid message format, fields:`,
                  fields
                );
                continue;
              }

              const rawData = fields[dataIndex + 1];
              if (!rawData) {
                console.warn(`[AgentSessionManager] Empty data field`);
                continue;
              }

              let job: AgentJob;
              try {
                const parsed = JSON.parse(rawData);
                job = AgentJobSchema.parse(parsed);
              } catch (parseError) {
                console.error(
                  '[AgentSessionManager] Failed to parse job data:',
                  parseError,
                  { messageId, rawData: rawData.slice(0, 200) }
                );
                // Acknowledge malformed message to prevent infinite redelivery
                await this.redis.xack(JOB_STREAM, groupName, messageId);
                continue;
              }

              console.log('[AgentSessionManager] Processing job:', job.id, {
                sessionId: job.sessionId,
                agentId: job.agentId,
              });

              await handler(job);

              console.log('[AgentSessionManager] Job completed:', job.id);

              // Acknowledge the message
              await this.redis.xack(JOB_STREAM, groupName, messageId);
            } catch (error) {
              console.error(
                '[AgentSessionManager] Error processing job:',
                error
              );
              // Don't ack - message will be redelivered
            }
          }
        }

        // Reset error count on successful iteration
        consecutiveErrors = 0;
      } catch (error) {
        consecutiveErrors++;
        console.error(
          `[AgentSessionManager] Error consuming jobs (attempt ${consecutiveErrors}/${maxConsecutiveErrors}):`,
          error
        );

        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error(
            '[AgentSessionManager] Max consecutive errors reached, stopping consumer'
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
        console.log(`[AgentSessionManager] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // ============= Event Publishing Methods =============

  /**
   * Publish an event to a session's event stream
   */
  async publishEvent(
    sessionId: string,
    event: Omit<StreamEvent, 'id' | 'timestamp'>
  ): Promise<string> {
    const streamName = getSessionStream(sessionId);
    const fullEvent = {
      ...event,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    const messageId = await this.redis.xadd(
      streamName,
      '*',
      'data',
      JSON.stringify(fullEvent)
    );

    return messageId ?? fullEvent.id;
  }

  /**
   * Subscribe to session events as an async iterator
   * Supports reconnection by providing lastId
   * Each subscription gets its own Redis connection to avoid blocking contention
   */
  async *subscribeToSession(
    sessionId: string,
    lastId?: string
  ): AsyncGenerator<StreamEvent, void, unknown> {
    const streamName = getSessionStream(sessionId);
    // Default to '$' (new events only) - client should ensure subscription is
    // connected before sending messages to avoid missing events
    let currentId = lastId ?? '$';

    // Create a dedicated connection for this subscription
    // This ensures multiple concurrent subscriptions don't block each other
    const subscriptionRedis = this.createSubscriptionConnection();

    try {
      // Wait for connection to be ready
      await new Promise<void>((resolve, reject) => {
        if (subscriptionRedis.status === 'ready') {
          resolve();
        } else {
          subscriptionRedis.once('ready', resolve);
          subscriptionRedis.once('error', reject);
        }
      });

      while (true) {
        try {
          const result = (await subscriptionRedis.call(
            'XREAD',
            'BLOCK',
            '5000',
            'COUNT',
            '10',
            'STREAMS',
            streamName,
            currentId
          )) as [string, [string, string[]][]][] | null;

          if (!result) continue;

          for (const [, messages] of result) {
            for (const [messageId, fields] of messages) {
              currentId = messageId;

              const dataIndex = fields.indexOf('data');
              if (dataIndex === -1 || dataIndex + 1 >= fields.length) continue;

              const rawData = fields[dataIndex + 1];
              if (!rawData) continue;

              try {
                const parsed = JSON.parse(rawData);
                const event = StreamEventSchema.parse(parsed);
                yield event;
              } catch (parseError) {
                console.error(
                  '[AgentSessionManager] Failed to parse event data:',
                  parseError,
                  { messageId, rawData: rawData.slice(0, 200) }
                );
                // Skip malformed event and continue
                continue;
              }

              // Note: Don't end subscription on terminal events (message_complete, error, interrupted)
              // The subscription should stay alive to receive events for subsequent messages
              // Client manages subscription lifecycle (unsubscribes when leaving session)
            }
          }
        } catch (error) {
          console.error('Error reading stream:', error);
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    } finally {
      // Clean up the connection when subscription ends
      await subscriptionRedis.quit().catch(() => {
        // Ignore errors during cleanup
      });
    }
  }

  /**
   * Get the last message ID in a session's event stream
   * Used for subscription resumption after page refresh
   * Returns undefined if stream doesn't exist or is empty
   */
  async getLastStreamId(sessionId: string): Promise<string | undefined> {
    const streamName = getSessionStream(sessionId);

    // XREVRANGE with COUNT 1 gets the last entry
    const result = await this.redis.xrevrange(streamName, '+', '-', 'COUNT', 1);

    if (result.length === 0) {
      return undefined;
    }

    return result[0]?.[0]; // Return the message ID
  }

  /**
   * Get all events for a session (for history replay)
   */
  async getRedisSessionEvents(
    sessionId: string,
    options: { start?: string; end?: string; count?: number } = {}
  ): Promise<StreamEvent[]> {
    const streamName = getSessionStream(sessionId);
    const { start = '-', end = '+', count = 1000 } = options;

    const result = await this.redis.xrange(
      streamName,
      start,
      end,
      'COUNT',
      count
    );

    return result
      .map(([id, fields]) => {
        const dataIndex = fields.indexOf('data');
        if (dataIndex === -1 || dataIndex + 1 >= fields.length) {
          console.warn(
            '[AgentSessionManager] Invalid stream event format, skipping:',
            { id }
          );
          return null;
        }
        const rawData = fields[dataIndex + 1];
        if (!rawData) {
          console.warn('[AgentSessionManager] Missing event data, skipping:', {
            id,
          });
          return null;
        }
        try {
          const parsed = JSON.parse(rawData);
          return StreamEventSchema.parse(parsed);
        } catch (parseError) {
          console.error(
            '[AgentSessionManager] Failed to parse event in history:',
            parseError,
            { id, rawData: rawData.slice(0, 200) }
          );
          return null;
        }
      })
      .filter((event): event is StreamEvent => event !== null);
  }

  /**
   * Trim old events from a session stream
   */
  async trimSessionStream(sessionId: string, maxLen: number): Promise<number> {
    const streamName = getSessionStream(sessionId);
    return this.redis.xtrim(streamName, 'MAXLEN', '~', maxLen);
  }

  /**
   * Delete a session stream entirely
   */
  async deleteSessionStream(sessionId: string): Promise<number> {
    const streamName = getSessionStream(sessionId);
    return this.redis.del(streamName);
  }

  // ============= Job Registry Methods =============

  /**
   * Register that a worker is processing a job for a session
   */
  async registerJob(sessionId: string, workerId: string): Promise<void> {
    await this.redis.hset(ACTIVE_JOBS_KEY, sessionId, workerId);
  }

  /**
   * Unregister a job when it's complete
   */
  async unregisterJob(sessionId: string): Promise<void> {
    await this.redis
      .multi()
      .hdel(ACTIVE_JOBS_KEY, sessionId)
      .hdel(INTERRUPT_REQUESTS_KEY, sessionId)
      .exec();
  }

  /**
   * Check if a session has an active job
   */
  async hasActiveJob(sessionId: string): Promise<boolean> {
    const workerId = await this.redis.hget(ACTIVE_JOBS_KEY, sessionId);
    return workerId !== null;
  }

  /**
   * Request interruption of an active job
   * Returns true if there was an active job to interrupt
   */
  async requestInterrupt(sessionId: string): Promise<boolean> {
    const hasJob = await this.hasActiveJob(sessionId);
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
