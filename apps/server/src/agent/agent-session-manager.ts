import type Redis from 'ioredis';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import type { AgentsFeature } from '../features/agents';
import type {
  MessageWithParts,
  AgentSessionMessageStatus,
  AgentSessionMessageMetadata,
  NewAgentSessionEvent,
} from '../features/agents';

// Zod schemas for type-safe parsing
const StreamEventTypeSchema = z.enum([
  'message_start',
  'text_delta',
  'reasoning_delta',
  'tool_call_start',
  'tool_call_args_delta',
  'tool_result',
  'message_complete',
  'error',
  'interrupted',
]);

const BaseStreamEventSchema = z.object({
  id: z.string(),
  type: StreamEventTypeSchema,
  sessionId: z.string(),
  messageId: z.string(),
  timestamp: z.string(),
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
    })
    .optional(),
  finishReason: z.string().optional(),
});

const ErrorEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('error'),
  error: z.string(),
  code: z.string().optional(),
});

const InterruptedEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('interrupted'),
});

export const StreamEventSchema = z.discriminatedUnion('type', [
  MessageStartEventSchema,
  TextDeltaEventSchema,
  ReasoningDeltaEventSchema,
  ToolCallStartEventSchema,
  ToolCallArgsDeltaEventSchema,
  ToolResultEventSchema,
  MessageCompleteEventSchema,
  ErrorEventSchema,
  InterruptedEventSchema,
]);

export type StreamEvent = z.infer<typeof StreamEventSchema>;

export const AgentJobSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  messageId: z.string(),
  agentId: z.string(),
  userId: z.string(),
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

// Return type for sendMessage
export interface SendMessageResult {
  userMessageId: string;
  assistantMessageId: string;
}

/**
 * AgentSessionManager - manages agent session lifecycle, job queues, and event streams
 * Combines job queue management, interrupt handling, event streaming, and database operations
 */
export class AgentSessionManager {
  private redis: Redis;
  private agentsFeature: AgentsFeature;

  constructor(redis: Redis, agentsFeature: AgentsFeature) {
    this.redis = redis;
    this.agentsFeature = agentsFeature;
  }

  // ============= Agent Access =============

  /**
   * Get agents feature for accessing agent definitions
   */
  get agents() {
    return this.agentsFeature.agents;
  }

  // ============= Message Operations =============

  /**
   * Send a message to a session - creates user message, assistant placeholder, and enqueues job
   */
  async sendMessage(
    sessionId: string,
    agentId: string,
    userId: string,
    content: string
  ): Promise<SendMessageResult> {
    // Create user message
    const userMessage = await this.agentsFeature.messages.create({
      sessionId,
      role: 'user',
      status: 'complete',
    });

    // Insert event for user message content
    await this.agentsFeature.events.insert({
      sessionId,
      messageId: userMessage.id,
      sequence: 0,
      type: 'text_delta',
      content,
    });

    // Create assistant message placeholder
    const assistantMessage = await this.agentsFeature.messages.create({
      sessionId,
      role: 'assistant',
      status: 'pending',
    });

    // Update session timestamp
    await this.agentsFeature.sessions.updateTimestamp(sessionId);

    // Enqueue job to Redis Stream
    await this.enqueueJob({
      sessionId,
      messageId: assistantMessage.id,
      agentId,
      userId,
    });

    return {
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
    };
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

  // ============= Job Queue Methods =============

  /**
   * Ensure consumer group exists for job stream
   */
  async ensureJobConsumerGroup(groupName: string): Promise<void> {
    try {
      await this.redis.xgroup('CREATE', JOB_STREAM, groupName, '0', 'MKSTREAM');
    } catch (error) {
      // Group already exists - that's fine
      if (
        error instanceof Error &&
        !error.message.includes('BUSYGROUP Consumer Group name already exists')
      ) {
        throw error;
      }
    }
  }

  /**
   * Enqueue an agent job to the job stream
   */
  async enqueueJob(job: Omit<AgentJob, 'id' | 'createdAt'>): Promise<string> {
    const fullJob: AgentJob = {
      ...job,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };

    console.log('[AgentSessionManager] Enqueuing job:', fullJob.id, {
      sessionId: fullJob.sessionId,
      agentId: fullJob.agentId,
    });

    const messageId = await this.redis.xadd(
      JOB_STREAM,
      '*',
      'data',
      JSON.stringify(fullJob)
    );

    console.log(
      '[AgentSessionManager] Job enqueued with Redis messageId:',
      messageId
    );

    return messageId ?? fullJob.id;
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

    await this.ensureJobConsumerGroup(groupName);

    while (true) {
      try {
        const result = (await this.redis.call(
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

        if (!result) continue;

        for (const [, messages] of result) {
          for (const [messageId, fields] of messages) {
            try {
              const dataIndex = fields.indexOf('data');
              if (dataIndex === -1 || dataIndex + 1 >= fields.length) continue;

              const rawData = fields[dataIndex + 1];
              if (!rawData) continue;

              const parsed = JSON.parse(rawData);
              const job = AgentJobSchema.parse(parsed);

              console.log('[AgentSessionManager] Processing job:', job.id, {
                sessionId: job.sessionId,
                agentId: job.agentId,
              });

              await handler(job);

              console.log('[AgentSessionManager] Job completed:', job.id);

              // Acknowledge the message
              await this.redis.xack(JOB_STREAM, groupName, messageId);
            } catch (error) {
              console.error('Error processing job:', error);
              // Don't ack - message will be redelivered
            }
          }
        }
      } catch (error) {
        console.error('Error consuming jobs:', error);
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
   */
  async *subscribeToSession(
    sessionId: string,
    lastId?: string
  ): AsyncGenerator<StreamEvent, void, unknown> {
    const streamName = getSessionStream(sessionId);
    let currentId = lastId ?? '$';

    while (true) {
      try {
        const result = (await this.redis.call(
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

            const parsed = JSON.parse(rawData);
            const event = StreamEventSchema.parse(parsed);
            yield event;

            // Check for terminal events
            if (
              event.type === 'message_complete' ||
              event.type === 'error' ||
              event.type === 'interrupted'
            ) {
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error reading stream:', error);
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
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

    return result.map(([_id, fields]) => {
      const dataIndex = fields.indexOf('data');
      if (dataIndex === -1 || dataIndex + 1 >= fields.length) {
        throw new Error('Invalid stream event format');
      }
      const rawData = fields[dataIndex + 1];
      if (!rawData) {
        throw new Error('Missing event data');
      }
      const parsed = JSON.parse(rawData);
      return StreamEventSchema.parse(parsed);
    });
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
