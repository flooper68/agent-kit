import crypto from 'crypto';
import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { WebSocketServer, type WebSocket } from 'ws';
import { logger } from './logger';
import { EventBuffer } from './event-buffer';
import type { LocalAgentWebSocketRegistry } from './local-agent-websocket-registry';
import type { LocalAgentsConnectionManager } from './local-agents-connection-manager';
import type { EventStreamManager } from './event-stream-manager';
import type { StreamingStateManager } from './streaming-state-manager';
import { STREAMING_HEARTBEAT_INTERVAL_MS } from './streaming-state-manager';
import type { AgentsFeature } from '../features/agents';
import type { LocalAgentsFeature } from '../features/local-agents';

interface AgentInfo {
  agent: { id: string; userId: string; name: string };
  connectionId: string;
}

/**
 * Service for managing WebSocket connections from local agents.
 * Handles connection lifecycle, message processing, and event forwarding.
 */
export class LocalAgentWebSocketService {
  private wss: WebSocketServer;
  private log = logger.child({ component: 'LocalAgentWebSocketService' });
  // Track last heartbeat time per session to avoid excessive Redis calls
  private lastHeartbeatBySession = new Map<string, number>();

  constructor(
    private wsRegistry: LocalAgentWebSocketRegistry,
    private connectionManager: LocalAgentsConnectionManager,
    private eventStreamManager: EventStreamManager,
    private streamingStateManager: StreamingStateManager,
    private agentsFeature: AgentsFeature,
    private localAgentsFeature: LocalAgentsFeature
  ) {
    this.wss = new WebSocketServer({ noServer: true });
    this.setupConnectionHandler();
  }

  /**
   * Get the underlying WebSocket server instance
   */
  getWebSocketServer(): WebSocketServer {
    return this.wss;
  }

  /**
   * Handle HTTP upgrade requests for local agent WebSocket connections
   */
  handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const secretKey = url.searchParams.get('key');

    if (!secretKey) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    this.localAgentsFeature
      .validateKey(secretKey)
      .then((agent) => {
        if (!agent || agent.disabled) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        const connectionId = crypto.randomUUID();

        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request, {
            agent,
            connectionId,
          });
        });
      })
      .catch((err) => {
        this.log.error('Agent auth error', { err });
        socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
        socket.destroy();
      });
  }

  /**
   * Set up the WebSocket connection handler
   */
  private setupConnectionHandler(): void {
    this.wss.on(
      'connection',
      async (
        ws: WebSocket,
        _request: IncomingMessage,
        agentInfo: AgentInfo
      ) => {
        await this.handleConnection(ws, agentInfo);
      }
    );
  }

  /**
   * Handle a new WebSocket connection from a local agent
   */
  private async handleConnection(
    ws: WebSocket,
    agentInfo: AgentInfo
  ): Promise<void> {
    const { agent, connectionId } = agentInfo;

    // Track event sequence per message to avoid integer overflow
    // (Date.now() returns ~1.7 trillion which exceeds PostgreSQL integer max)
    const messageSequences = new Map<string, number>();

    // Buffer consecutive text/reasoning deltas per message to reduce DB writes
    const messageBuffers = new Map<string, EventBuffer>();

    // Register WebSocket connection for message forwarding
    this.wsRegistry.register(agent.id, ws);

    // Register connection in Redis
    await this.connectionManager.registerConnection(
      agent.userId,
      agent.id,
      connectionId
    );

    this.log.info('Local agent connected', {
      agentId: agent.id,
      agentName: agent.name,
    });

    // Ping every 30s to detect stale connections
    const pingInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.ping();
        void this.connectionManager.updatePing(agent.userId, agent.id);
      }
    }, 30000);

    ws.on('pong', () => {
      void this.connectionManager.updatePing(agent.userId, agent.id);
    });

    ws.on('message', async (data: Buffer) => {
      await this.handleMessage(agent, data, messageSequences, messageBuffers);
    });

    ws.on('close', async () => {
      clearInterval(pingInterval);
      this.wsRegistry.unregister(agent.id);
      await this.connectionManager.unregisterConnection(agent.userId, agent.id);
      this.log.info('Local agent disconnected', { agentId: agent.id });
    });

    ws.on('error', (err: Error) => {
      this.log.error('Local agent WebSocket error', { err });
    });
  }

  /**
   * Handle a message from a local agent
   */
  private async handleMessage(
    agent: { id: string; userId: string; name: string },
    data: Buffer,
    messageSequences: Map<string, number>,
    messageBuffers: Map<string, EventBuffer>
  ): Promise<void> {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'event': {
          await this.handleEventMessage(
            agent,
            message,
            messageSequences,
            messageBuffers
          );
          break;
        }

        default:
          this.log.warn('Unknown message type from local agent', {
            type: message.type,
          });
      }
    } catch (err) {
      this.log.error('Failed to handle message from local agent', {
        agentId: agent.id,
        err,
      });
    }
  }

  /**
   * Send heartbeat for streaming state if enough time has passed
   */
  private async maybeHeartbeat(sessionId: string): Promise<void> {
    const now = Date.now();
    const lastHeartbeat = this.lastHeartbeatBySession.get(sessionId) ?? 0;
    if (now - lastHeartbeat > STREAMING_HEARTBEAT_INTERVAL_MS) {
      await this.streamingStateManager.sendHeartbeat(sessionId);
      this.lastHeartbeatBySession.set(sessionId, now);
    }
  }

  /**
   * Handle an event message from a local agent
   */
  private async handleEventMessage(
    agent: { id: string; userId: string; name: string },
    message: { sessionId: string; messageId: string; event: AgentEvent },
    messageSequences: Map<string, number>,
    messageBuffers: Map<string, EventBuffer>
  ): Promise<void> {
    const { sessionId, messageId, event } = message;

    // Get next sequence number for this message
    const getNextSequence = (msgId: string): number => {
      const current = messageSequences.get(msgId) ?? 0;
      const next = current + 1;
      messageSequences.set(msgId, next);
      return next;
    };

    // Get or create buffer for this message
    const getOrCreateBuffer = (msgId: string): EventBuffer => {
      let buffer = messageBuffers.get(msgId);
      if (!buffer) {
        buffer = new EventBuffer();
        messageBuffers.set(msgId, buffer);
      }
      return buffer;
    };

    // Flush any buffered content to database
    const flushBuffer = async (msgId: string): Promise<void> => {
      const buffer = messageBuffers.get(msgId);
      if (!buffer) return;
      const buffered = buffer.flush();
      if (buffered) {
        await this.agentsFeature.events.insert({
          sessionId,
          messageId: msgId,
          sequence: buffered.sequence,
          type: buffered.event.type,
          content: buffered.event.content,
        });
      }
    };

    // Handle message_complete specially (before event DB insertion)
    if (event.type === 'message_complete') {
      // Flush any buffered content before completing
      await flushBuffer(messageId);

      // Update status and publish
      await this.agentsFeature.messages.updateStatus({
        messageId,
        status: 'complete',
        metadata: event.usage
          ? {
              tokensUsed:
                event.usage.promptTokens + event.usage.completionTokens,
            }
          : undefined,
      });
      await this.eventStreamManager.publish(sessionId, {
        type: 'message_complete',
        sessionId,
        messageId,
        usage: event.usage,
        finishReason: event.finishReason,
      } as Parameters<typeof this.eventStreamManager.publish>[1]);

      // Stop streaming state for reliable client state management
      await this.streamingStateManager.stopStreaming(sessionId);
      this.lastHeartbeatBySession.delete(sessionId);

      // Increment message count and trigger summarization (fire-and-forget)
      this.agentsFeature.sessions
        .incrementMessageCount(sessionId)
        .then((result) => {
          if (result?.messageCount) {
            return this.agentsFeature.summarization.trigger({
              sessionId,
              messageCount: result.messageCount,
              userId: agent.userId,
            });
          }
        })
        .catch((err) => {
          this.log.error('Summarization failed for local agent', { err });
        });

      // Clean up tracking for completed message
      messageSequences.delete(messageId);
      messageBuffers.delete(messageId);
      return;
    }

    // Insert event to database
    if (event.type === 'text_delta' || event.type === 'reasoning_delta') {
      // Send heartbeat to keep streaming state alive
      await this.maybeHeartbeat(sessionId);

      // Buffer consecutive same-type deltas to reduce DB writes
      const buffer = getOrCreateBuffer(messageId);
      const toFlush = buffer.add(
        { type: event.type, content: event.delta },
        getNextSequence(messageId)
      );
      if (toFlush) {
        await this.agentsFeature.events.insert({
          sessionId,
          messageId,
          sequence: toFlush.sequence,
          type: toFlush.event.type,
          content: toFlush.event.content,
        });
      }
    } else if (event.type === 'tool_call_start') {
      // Flush buffer before tool call
      await flushBuffer(messageId);
      await this.agentsFeature.events.insert({
        sessionId,
        messageId,
        sequence: getNextSequence(messageId),
        type: 'tool_call',
        toolCallId: event.toolCallId,
        toolName: event.toolName,
        toolArgs: event.toolArgs as Record<string, unknown>,
      });
    } else if (event.type === 'tool_call_args_delta') {
      // tool_call_args_delta is now included in tool_call_start, so skip
    } else if (event.type === 'tool_result') {
      // Flush buffer before tool result
      await flushBuffer(messageId);
      await this.agentsFeature.events.insert({
        sessionId,
        messageId,
        sequence: getNextSequence(messageId),
        type: 'tool_result',
        toolCallId: event.toolCallId,
        toolResult: event.result,
        isError: event.isError,
      });
    } else if (event.type === 'error') {
      // Flush buffer before error
      await flushBuffer(messageId);
      await this.agentsFeature.events.insert({
        sessionId,
        messageId,
        sequence: getNextSequence(messageId),
        type: 'error',
        errorCode: event.code,
        errorMessage: event.error,
        errorRetryable: event.retryable,
      });
      // Also update message status to error
      await this.agentsFeature.messages.updateStatus({
        messageId,
        status: 'error',
      });
      // Stop streaming state for reliable client state management
      await this.streamingStateManager.stopStreaming(sessionId);
      this.lastHeartbeatBySession.delete(sessionId);
    } else if (event.type === 'interrupted') {
      // Flush buffer before interrupted
      await flushBuffer(messageId);
      // Update message status to interrupted
      await this.agentsFeature.messages.updateStatus({
        messageId,
        status: 'interrupted',
      });
      // Stop streaming state for reliable client state management
      await this.streamingStateManager.stopStreaming(sessionId);
      this.lastHeartbeatBySession.delete(sessionId);
    }

    // Publish event to Redis stream for real-time delivery
    await this.eventStreamManager.publish(sessionId, {
      ...event,
      sessionId,
      messageId,
    });
  }
}

// Event types from local agents
type AgentEvent =
  | { type: 'text_delta'; delta: string }
  | { type: 'reasoning_delta'; delta: string }
  | {
      type: 'tool_call_start';
      toolCallId: string;
      toolName: string;
      toolArgs: unknown;
    }
  | { type: 'tool_call_args_delta'; toolCallId: string; delta: string }
  | {
      type: 'tool_result';
      toolCallId: string;
      result: unknown;
      isError: boolean;
    }
  | { type: 'message_start' }
  | {
      type: 'message_complete';
      usage?: { promptTokens: number; completionTokens: number };
      finishReason?: string;
    }
  | { type: 'error'; code: string; error: string; retryable: boolean }
  | { type: 'interrupted' };
