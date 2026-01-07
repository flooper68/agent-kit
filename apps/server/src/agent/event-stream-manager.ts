import type Redis from 'ioredis';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// Zod schemas for stream events
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
  toolArgs: z.record(z.string(), z.unknown()).optional(),
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
      cacheReadTokens: z.number().optional(),
      cacheWriteTokens: z.number().optional(),
      durationMs: z.number().optional(),
      durationApiMs: z.number().optional(),
      numTurns: z.number().optional(),
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

// Redis key helper
const getSessionStream = (sessionId: string) =>
  `agent:session:${sessionId}:events`;

export type RedisConnectionFactory = () => Redis;

/**
 * EventStreamManager - Infrastructure manager for Redis event streams
 * Handles publishing and subscribing to session event streams
 */
export class EventStreamManager {
  constructor(
    private redis: Redis,
    private createSubscriptionConnection: RedisConnectionFactory
  ) {}

  /**
   * Publish an event to a session's event stream
   */
  async publish(
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
   *
   * @param sessionId - The session to subscribe to
   * @param lastId - Optional ID to resume from (events after this ID will be returned)
   * @param replayHistory - If true, first yields all historical events from the beginning
   */
  async *subscribe(
    sessionId: string,
    lastId?: string,
    replayHistory: boolean = false
  ): AsyncGenerator<StreamEvent, void, unknown> {
    const streamName = getSessionStream(sessionId);

    // Create a dedicated connection for this subscription
    // This ensures multiple concurrent subscriptions don't block each other
    console.log('[EventStreamManager] Creating subscription connection', {
      sessionId,
      streamName,
    });
    const subscriptionRedis = this.createSubscriptionConnection();

    try {
      // Wait for connection to be ready with timeout
      // Without timeout, this can hang forever if Redis connection fails silently
      await Promise.race([
        new Promise<void>((resolve, reject) => {
          if (subscriptionRedis.status === 'ready') {
            resolve();
          } else {
            subscriptionRedis.once('ready', resolve);
            subscriptionRedis.once('error', reject);
          }
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error('Redis subscription connection timeout after 10s')
              ),
            10000
          )
        ),
      ]);

      console.log('[EventStreamManager] Subscription connection ready', {
        sessionId,
      });

      // If replayHistory is true, first yield all historical events
      // Paginate through all events to handle sessions with >1000 events
      if (replayHistory) {
        const BATCH_SIZE = 1000;
        let cursor = '-';
        let lastMessageId: string | undefined;

        // Paginate through all historical events
        while (true) {
          const batch = await this.getEventsWithIds(sessionId, {
            start: cursor,
            count: BATCH_SIZE,
          });

          if (batch.length === 0) break;

          for (const { messageId, event } of batch) {
            yield event;
            lastMessageId = messageId;
          }

          // If we got fewer than BATCH_SIZE, we've reached the end
          if (batch.length < BATCH_SIZE) break;

          // Move cursor past the last message ID for next batch
          // Redis XRANGE exclusive start uses '(' prefix
          cursor = `(${lastMessageId}`;
        }

        // Use the last message ID from replay, or get it if no events were replayed
        lastId = lastMessageId ?? (await this.getLastId(sessionId));
      }

      // Default to '$' (new events only) - client should ensure subscription is
      // connected before sending messages to avoid missing events
      let currentId = lastId ?? '$';

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
                  '[EventStreamManager] Failed to parse event data:',
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
          console.error('[EventStreamManager] Error reading stream:', error);
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('[EventStreamManager] Subscription error', {
        sessionId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    } finally {
      console.log('[EventStreamManager] Cleaning up subscription connection', {
        sessionId,
      });
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
  async getLastId(sessionId: string): Promise<string | undefined> {
    const streamName = getSessionStream(sessionId);

    // XREVRANGE with COUNT 1 gets the last entry
    const result = await this.redis.xrevrange(streamName, '+', '-', 'COUNT', 1);

    if (result.length === 0) {
      return undefined;
    }

    return result[0]?.[0]; // Return the message ID
  }

  /**
   * Get events with their Redis message IDs for pagination
   */
  private async getEventsWithIds(
    sessionId: string,
    options: { start?: string; end?: string; count?: number } = {}
  ): Promise<Array<{ messageId: string; event: StreamEvent }>> {
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
      .map(([messageId, fields]) => {
        const dataIndex = fields.indexOf('data');
        if (dataIndex === -1 || dataIndex + 1 >= fields.length) {
          console.warn(
            '[EventStreamManager] Invalid stream event format, skipping:',
            { messageId }
          );
          return null;
        }
        const rawData = fields[dataIndex + 1];
        if (!rawData) {
          console.warn('[EventStreamManager] Missing event data, skipping:', {
            messageId,
          });
          return null;
        }
        try {
          const parsed = JSON.parse(rawData);
          return { messageId, event: StreamEventSchema.parse(parsed) };
        } catch (parseError) {
          console.error(
            '[EventStreamManager] Failed to parse event in history:',
            parseError,
            { messageId, rawData: rawData.slice(0, 200) }
          );
          return null;
        }
      })
      .filter(
        (item): item is { messageId: string; event: StreamEvent } =>
          item !== null
      );
  }

  /**
   * Trim old events from a session stream
   */
  async trim(sessionId: string, maxLen: number): Promise<number> {
    const streamName = getSessionStream(sessionId);
    return this.redis.xtrim(streamName, 'MAXLEN', '~', maxLen);
  }

  /**
   * Delete a session stream entirely
   */
  async delete(sessionId: string): Promise<number> {
    const streamName = getSessionStream(sessionId);
    return this.redis.del(streamName);
  }
}
