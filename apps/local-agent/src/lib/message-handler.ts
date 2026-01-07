import type WebSocket from 'ws';
import { createHandler } from './handlers';
import { createLogger } from './logger';
import { EventBufferQueue } from './event-buffer-queue';
import { ArtifactToolRelay } from './artifact-tool-relay';
import { ServerToolRelay } from './server-tool-relay';
import type { AgentHandler } from './types';
import {
  ServerToAgentMessageSchema,
  type ClaudeCodeHandlerConfig,
  type ActiveSession,
  type StreamEvent,
  type UserMessagePayload,
  type InterruptPayload,
  type ArtifactToolResponsePayload,
  type ServerToolResponsePayload,
} from './types';

const log = createLogger('Handler');

export interface MessageHandlerOptions {
  /** Handler type identifier (e.g., 'claude-code') */
  handlerType: string;
  /** Handler configuration */
  config: ClaudeCodeHandlerConfig;
  /** Event buffer for storing events when disconnected */
  eventBuffer: EventBufferQueue;
}

export class MessageHandler {
  private ws: WebSocket;
  private handler: AgentHandler;
  private activeSessions: Map<string, ActiveSession> = new Map();
  private eventsSentCount: Map<string, number> = new Map();
  private eventBuffer: EventBufferQueue;
  private artifactRelay: ArtifactToolRelay;
  private serverRelay: ServerToolRelay;

  constructor(ws: WebSocket, options: MessageHandlerOptions) {
    this.ws = ws;
    this.eventBuffer = options.eventBuffer;
    this.artifactRelay = new ArtifactToolRelay();
    this.serverRelay = new ServerToolRelay();
    // Create handler once and reuse for all messages
    // This allows stateful providers (like ClaudeCliProvider) to persist session data
    // Pass artifact relay and server relay to handler for server operations
    this.handler = createHandler(options.handlerType, options.config, {
      artifactRelay: this.artifactRelay,
      serverRelay: this.serverRelay,
    });
    log.debug('MessageHandler constructed', {
      handlerType: options.handlerType,
      handlerId: this.handler.id,
      cwd: options.config.cwd,
      allowedTools: options.config.allowedTools,
    });
  }

  /**
   * Get the artifact tool relay for handlers to use.
   */
  getArtifactRelay(): ArtifactToolRelay {
    return this.artifactRelay;
  }

  /**
   * Get the server tool relay for handlers to use.
   */
  getServerRelay(): ServerToolRelay {
    return this.serverRelay;
  }

  async handleMessage(data: string): Promise<void> {
    let message;

    log.debug('Parsing incoming message', {
      dataLength: data.length,
    });

    try {
      const parsed = JSON.parse(data);
      message = ServerToAgentMessageSchema.parse(parsed);
      log.debug('Message parsed successfully', {
        type: message.type,
      });
    } catch (error) {
      log.error('Failed to parse message', {
        error: error instanceof Error ? error.message : String(error),
        dataPreview: data.slice(0, 200),
      });
      return;
    }

    switch (message.type) {
      case 'user_message':
        log.info('Received user_message', {
          sessionId: message.sessionId,
          messageId: message.messageId,
          contentLength: message.content.length,
          contentPreview:
            message.content.length > 100
              ? message.content.slice(0, 100) + '...'
              : message.content,
        });
        await this.handleUserMessage(message);
        break;
      case 'interrupt':
        log.info('Received interrupt request', {
          sessionId: message.sessionId,
        });
        await this.handleInterrupt(message);
        break;
      case 'artifact_tool_response':
        log.debug('Received artifact_tool_response', {
          requestId: message.requestId.slice(0, 8) + '...',
          isError: message.isError,
        });
        this.handleArtifactToolResponse(message);
        break;
      case 'server_tool_response':
        log.debug('Received server_tool_response', {
          requestId: message.requestId.slice(0, 8) + '...',
          isError: message.isError,
        });
        this.handleServerToolResponse(message);
        break;
    }
  }

  private async handleUserMessage(message: UserMessagePayload): Promise<void> {
    const { sessionId, messageId, content, messages, events } = message;
    const startTime = Date.now();

    log.info('Starting agent execution', {
      sessionId,
      messageId,
      promptLength: content.length,
      messagesCount: messages.length,
      eventsCount: events.length,
    });

    // Set relay WebSocket connections
    this.artifactRelay.setConnection(this.ws);
    this.serverRelay.setConnection(this.ws);

    // Create abort controller for this session
    const abortController = new AbortController();

    // Track active session
    this.activeSessions.set(sessionId, {
      sessionId,
      messageId,
      abortController,
    });
    this.eventsSentCount.set(sessionId, 0);

    log.debug('Session registered as active', {
      sessionId,
      totalActiveSessions: this.activeSessions.size,
    });

    try {
      // Run handler and iterate over events
      // Handler is reused across messages to maintain session state
      const generator = this.handler.run({
        sessionId,
        messageId,
        content,
        messages,
        events,
        abortSignal: abortController.signal,
      });

      let result: IteratorResult<
        StreamEvent,
        {
          usage?: {
            promptTokens: number;
            completionTokens: number;
            estimatedCost?: number;
          };
        }
      >;
      while (!(result = await generator.next()).done) {
        this.sendEvent(sessionId, messageId, result.value);
      }

      // Handle completion - result.value contains the final AgentRunResult
      const finalResult = result.value;
      const duration = Date.now() - startTime;
      const eventCount = this.eventsSentCount.get(sessionId) ?? 0;

      log.info('Agent execution completed', {
        sessionId,
        messageId,
        durationMs: duration,
        eventsSent: eventCount,
        usage: finalResult.usage
          ? {
              promptTokens: finalResult.usage.promptTokens,
              completionTokens: finalResult.usage.completionTokens,
              totalTokens:
                finalResult.usage.promptTokens +
                finalResult.usage.completionTokens,
              estimatedCost: finalResult.usage.estimatedCost,
            }
          : undefined,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      log.error('Agent execution failed', {
        sessionId,
        messageId,
        durationMs: duration,
        error: errorMessage,
        stack: errorStack,
      });

      this.sendEvent(sessionId, messageId, {
        type: 'error',
        error: errorMessage,
        code: 'HANDLER_ERROR',
        retryable: true,
      });
    } finally {
      this.activeSessions.delete(sessionId);
      this.eventsSentCount.delete(sessionId);
      // Clear relay connections when no more active sessions
      if (this.activeSessions.size === 0) {
        this.artifactRelay.clearConnection();
        this.serverRelay.clearConnection();
      }
      log.debug('Session cleaned up', {
        sessionId,
        remainingActiveSessions: this.activeSessions.size,
      });
    }
  }

  private async handleInterrupt(message: InterruptPayload): Promise<void> {
    const { sessionId } = message;
    const session = this.activeSessions.get(sessionId);

    if (session) {
      log.info('Interrupting active session', {
        sessionId,
        messageId: session.messageId,
      });
      session.abortController.abort();
      log.debug('Abort signal sent');
    } else {
      log.warn('No active session found to interrupt', {
        sessionId,
        activeSessions: Array.from(this.activeSessions.keys()),
      });
    }
  }

  private sendEvent(
    sessionId: string,
    messageId: string,
    event: StreamEvent
  ): void {
    const eventCount = (this.eventsSentCount.get(sessionId) ?? 0) + 1;
    this.eventsSentCount.set(sessionId, eventCount);

    // Log event details (truncate large payloads)
    const eventLog: Record<string, unknown> = {
      sessionId: sessionId.slice(0, 8) + '...',
      eventNumber: eventCount,
      eventType: event.type,
    };

    // Add type-specific details
    if (event.type === 'text_delta') {
      eventLog.deltaLength = event.delta.length;
      eventLog.deltaPreview =
        event.delta.length > 50
          ? event.delta.slice(0, 50) + '...'
          : event.delta;
    } else if (event.type === 'reasoning_delta') {
      eventLog.deltaLength = event.delta.length;
    } else if (event.type === 'tool_call_start') {
      eventLog.toolCallId = event.toolCallId;
      eventLog.toolName = event.toolName;
    } else if (event.type === 'tool_call_args_delta') {
      eventLog.toolCallId = event.toolCallId;
      eventLog.argsLength = event.delta.length;
    } else if (event.type === 'tool_result') {
      eventLog.toolCallId = event.toolCallId;
      eventLog.isError = event.isError;
      eventLog.resultType = typeof event.result;
    } else if (event.type === 'message_complete') {
      eventLog.usage = event.usage;
      eventLog.finishReason = event.finishReason;
    } else if (event.type === 'error') {
      eventLog.errorCode = event.code;
      eventLog.errorMessage = event.error;
      eventLog.retryable = event.retryable;
    }

    log.debug('Sending event to server', eventLog);

    if (this.ws.readyState === this.ws.OPEN) {
      const payload = JSON.stringify({
        type: 'event',
        sessionId,
        messageId,
        event,
      });

      this.ws.send(payload);
      log.debug('Event sent', {
        payloadSize: payload.length,
      });
    } else {
      // Buffer the event for delivery when connection is restored
      this.eventBuffer.enqueue(sessionId, messageId, event);
      log.info('Event buffered - WebSocket not open', {
        readyState: this.ws.readyState,
        eventType: event.type,
        bufferSize: this.eventBuffer.size,
      });
    }
  }

  /**
   * Flush all buffered events to the server.
   * Should be called after reconnection before processing new messages.
   */
  flushBuffer(): { flushed: number; failed: boolean } {
    const bufferedEvents = this.eventBuffer.drain();

    if (bufferedEvents.length === 0) {
      return { flushed: 0, failed: false };
    }

    log.info('Flushing buffered events', {
      count: bufferedEvents.length,
      oldestTimestamp: bufferedEvents[0]?.timestamp,
    });

    let flushedCount = 0;
    for (const { sessionId, messageId, event } of bufferedEvents) {
      if (this.ws.readyState !== this.ws.OPEN) {
        // Connection lost during flush - re-buffer remaining events
        const remaining = bufferedEvents.slice(flushedCount);
        for (const item of remaining) {
          this.eventBuffer.enqueue(item.sessionId, item.messageId, item.event);
        }
        log.warn('Connection lost during flush, re-buffered remaining events', {
          flushedSoFar: flushedCount,
          reBuffered: remaining.length,
        });
        return { flushed: flushedCount, failed: true };
      }

      const payload = JSON.stringify({
        type: 'event',
        sessionId,
        messageId,
        event,
      });
      this.ws.send(payload);
      flushedCount++;
    }

    log.info('Buffer flush completed', { count: flushedCount });
    return { flushed: flushedCount, failed: false };
  }

  /**
   * Handle an artifact tool response from the server.
   */
  private handleArtifactToolResponse(
    message: ArtifactToolResponsePayload
  ): void {
    this.artifactRelay.handleResponse(
      message.requestId,
      message.result,
      message.isError
    );
  }

  /**
   * Handle a server tool response from the server.
   */
  private handleServerToolResponse(message: ServerToolResponsePayload): void {
    this.serverRelay.handleResponse(
      message.requestId,
      message.result,
      message.isError
    );
  }
}
