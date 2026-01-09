import crypto from 'crypto';
import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { WebSocketServer, type WebSocket } from 'ws';
import { z } from 'zod';
import { SERVER_TOOL_NAMES } from '@agent-kit/shared';
import { logger } from './logger';
import { EventBuffer } from './event-buffer';
import {
  generateNonce,
  computeHmac,
  verifyHmac,
  isTimestampValid,
  buildAgentHmacMessage,
  buildServerHmacMessage,
  type ServerChallenge,
  type AuthChallenge,
} from '@agent-kit/auth';
import type { ExternalAgentWebSocketRegistry } from './external-agent-websocket-registry';
import type { ExternalAgentsConnectionManager } from './external-agents-connection-manager';
import type { EventStreamManager } from './event-stream-manager';
import type { StreamingStateManager } from './streaming-state-manager';
import { STREAMING_HEARTBEAT_INTERVAL_MS } from './streaming-state-manager';
import type { AgentsFeature } from '../features/agents';
import type { ArtifactsFeature } from '../features/artifacts';
import type { ProjectsFeature } from '../features/projects';
import type { TasksFeature } from '../features/tasks';
import type { PubSubManager } from '../real-time';
import { getToolsById } from './tools';
import type { AgentSpawner } from './agent-spawner';

// Zod schemas for validating WebSocket messages from external agents
const AgentEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text_delta'), delta: z.string() }),
  z.object({ type: z.literal('reasoning_delta'), delta: z.string() }),
  z.object({
    type: z.literal('tool_call_start'),
    toolCallId: z.string(),
    toolName: z.string(),
    toolArgs: z.unknown(),
  }),
  z.object({
    type: z.literal('tool_call_args_delta'),
    toolCallId: z.string(),
    delta: z.string(),
  }),
  z.object({
    type: z.literal('tool_result'),
    toolCallId: z.string(),
    result: z.unknown(),
    isError: z.boolean(),
  }),
  z.object({ type: z.literal('message_start') }),
  z.object({
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
  }),
  z.object({
    type: z.literal('error'),
    code: z.string().optional(),
    error: z.string(),
    retryable: z.boolean().optional(),
  }),
  z.object({ type: z.literal('interrupted') }),
]);

const EventMessageSchema = z.object({
  type: z.literal('event'),
  sessionId: z.string().uuid(),
  messageId: z.string().uuid(),
  event: AgentEventSchema,
});

// Schema for artifact tool requests from external agents
const ArtifactToolRequestSchema = z.object({
  type: z.literal('artifact_tool_request'),
  requestId: z.string().uuid(),
  sessionId: z.string().uuid(),
  tool: z.enum(['writeArtifact', 'readArtifact', 'searchArtifacts']),
  params: z.record(z.string(), z.unknown()),
  timestamp: z.string(),
});

// Schema for server tool requests from external agents (uses shared tool names)
const ServerToolRequestSchema = z.object({
  type: z.literal('server_tool_request'),
  requestId: z.string().uuid(),
  sessionId: z.string().uuid(),
  messageId: z.string().uuid().optional(), // For spawn_session_created event association
  toolCallId: z.string().optional(), // The actual tool call ID from tool_call_start event
  tool: z.enum(SERVER_TOOL_NAMES),
  params: z.record(z.string(), z.unknown()),
  timestamp: z.string(),
});

// Schemas for validating artifact tool parameters
const WriteArtifactParamsSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1).max(1_000_000),
  summary: z.string().max(500).optional(),
});

const ReadArtifactParamsSchema = z.object({
  artifactId: z.string().uuid(),
});

const SearchArtifactsParamsSchema = z.object({
  query: z.string().optional().default(''),
  limit: z.number().int().min(1).max(100).optional().default(10),
  offset: z.number().int().min(0).optional().default(0),
});

const AgentMessageSchema = z.discriminatedUnion('type', [
  EventMessageSchema,
  ArtifactToolRequestSchema,
  ServerToolRequestSchema,
]);

interface AgentInfo {
  agent: { id: string; key: string; userId: string; name: string };
  connectionId: string;
}

// Session cache TTL in milliseconds (5 minutes)
const SESSION_CACHE_TTL_MS = 5 * 60 * 1000;

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 100; // Max 100 requests per minute per agent

interface CachedSession {
  session: { orgId: string; userId: string; spawnDepth: number };
  cachedAt: number;
}

interface RateLimitEntry {
  requests: number[];
}

/**
 * Service for managing WebSocket connections from external agents.
 * Handles connection lifecycle, message processing, and event forwarding.
 */
export class ExternalAgentWebSocketService {
  private wss: WebSocketServer;
  private log = logger.child({ component: 'ExternalAgentWebSocketService' });
  // Track last heartbeat time per session to avoid excessive Redis calls
  private lastHeartbeatBySession = new Map<string, number>();
  // Cache session info to reduce DB lookups for server tool requests
  private sessionCache = new Map<string, CachedSession>();
  // Rate limiting per agent
  private rateLimitByAgent = new Map<string, RateLimitEntry>();
  // Cleanup interval for stale cache entries
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  // Agent spawner for sub-agent delegation (set after construction due to circular deps)
  private agentSpawner?: AgentSpawner;

  constructor(
    private wsRegistry: ExternalAgentWebSocketRegistry,
    private connectionManager: ExternalAgentsConnectionManager,
    private eventStreamManager: EventStreamManager,
    private streamingStateManager: StreamingStateManager,
    private agentsFeature: AgentsFeature,
    private artifactsFeature: ArtifactsFeature,
    private projectsFeature?: ProjectsFeature,
    private tasksFeature?: TasksFeature,
    private pubsub?: PubSubManager
  ) {
    this.wss = new WebSocketServer({ noServer: true });
    this.setupConnectionHandler();
    this.startCacheCleanup();
  }

  /**
   * Start periodic cleanup of stale cache entries.
   * Runs every 5 minutes to remove expired session cache and empty rate limit entries.
   */
  private startCacheCleanup(): void {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupStaleCaches();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Stop the service and clean up resources.
   * Call this during graceful shutdown.
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessionCache.clear();
    this.rateLimitByAgent.clear();
    this.lastHeartbeatBySession.clear();
    this.log.info('ExternalAgentWebSocketService shutdown complete');
  }

  /**
   * Set the agent spawner for sub-agent delegation.
   * Called after construction due to circular dependency with AgentSpawner.
   */
  setAgentSpawner(spawner: AgentSpawner): void {
    this.agentSpawner = spawner;
  }

  /**
   * Clean up stale cache entries to prevent memory leaks.
   */
  private cleanupStaleCaches(): void {
    const now = Date.now();
    let sessionCacheCleared = 0;
    let rateLimitCleared = 0;

    // Clean expired session cache entries
    for (const [sessionId, cached] of this.sessionCache) {
      if (now - cached.cachedAt > SESSION_CACHE_TTL_MS) {
        this.sessionCache.delete(sessionId);
        sessionCacheCleared++;
      }
    }

    // Clean rate limit entries for agents with no recent requests
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    for (const [agentId, entry] of this.rateLimitByAgent) {
      // Filter out old requests first
      entry.requests = entry.requests.filter((ts) => ts > windowStart);
      // Remove entry if no requests remain
      if (entry.requests.length === 0) {
        this.rateLimitByAgent.delete(agentId);
        rateLimitCleared++;
      }
    }

    if (sessionCacheCleared > 0 || rateLimitCleared > 0) {
      this.log.debug('Cleaned up stale cache entries', {
        sessionCacheCleared,
        rateLimitCleared,
        sessionCacheSize: this.sessionCache.size,
        rateLimitSize: this.rateLimitByAgent.size,
      });
    }
  }

  /**
   * Get the underlying WebSocket server instance
   */
  getWebSocketServer(): WebSocketServer {
    return this.wss;
  }

  /**
   * Handle HTTP upgrade requests for external agent WebSocket connections.
   * Authentication is handled via first message after connection (not URL query param)
   * to avoid API keys being logged in server access logs.
   */
  handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void {
    // Accept connection without authentication - auth happens via first message
    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss.emit('connection', ws, request);
    });
  }

  /**
   * Set up the WebSocket connection handler
   */
  private setupConnectionHandler(): void {
    this.wss.on(
      'connection',
      async (ws: WebSocket, _request: IncomingMessage) => {
        await this.handleUnauthenticatedConnection(ws);
      }
    );
  }

  /**
   * Handle a new unauthenticated WebSocket connection.
   * Uses HMAC mutual authentication:
   * 1. Server sends challenge with nonce
   * 2. Agent responds with HMAC proving it knows the secret
   * 3. Server verifies and responds with its own HMAC proving server identity
   */
  private async handleUnauthenticatedConnection(ws: WebSocket): Promise<void> {
    // Set up auth timeout - close connection if no auth within 30s
    const authTimeout = setTimeout(() => {
      this.log.warn('Auth timeout - closing unauthenticated connection');
      ws.close(4000, 'Authentication timeout');
    }, 30000);

    // Generate and send server challenge immediately
    const serverNonce = generateNonce();
    const serverTimestamp = Date.now();

    const challenge: ServerChallenge = {
      type: 'server_challenge',
      serverNonce,
      timestamp: serverTimestamp,
    };
    ws.send(JSON.stringify(challenge));

    // Wait for auth_challenge response
    const handleAuthMessage = async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as AuthChallenge;

        if (message.type !== 'auth_challenge') {
          ws.send(
            JSON.stringify({
              type: 'auth_error',
              error: 'Expected auth_challenge message',
            })
          );
          ws.close(4001, 'Invalid auth message');
          return;
        }

        // Validate required fields
        if (
          !message.keyPrefix ||
          !message.clientNonce ||
          !message.serverNonceHmac ||
          !message.timestamp
        ) {
          ws.send(
            JSON.stringify({
              type: 'auth_error',
              error: 'Missing required auth fields',
            })
          );
          ws.close(4001, 'Invalid auth message');
          return;
        }

        // Verify timestamp is within valid window (30 seconds)
        if (!isTimestampValid(message.timestamp)) {
          ws.send(
            JSON.stringify({
              type: 'auth_error',
              error: 'Challenge expired',
            })
          );
          ws.close(4001, 'Challenge expired');
          return;
        }

        // Find agent by key prefix
        const agent = await this.agentsFeature.customAgents.findByKeyPrefix(
          message.keyPrefix
        );

        if (!agent) {
          ws.send(
            JSON.stringify({
              type: 'auth_error',
              error: 'Invalid credentials',
            })
          );
          ws.close(4001, 'Authentication failed');
          return;
        }

        // Verify agent's HMAC - proves agent knows the secret
        // The agent.secretKey in DB is already SHA256(plaintextKey)
        if (
          !verifyHmac(
            agent.secretKey,
            buildAgentHmacMessage(
              serverNonce,
              message.clientNonce,
              message.timestamp
            ),
            message.serverNonceHmac
          )
        ) {
          this.log.warn('HMAC verification failed', {
            keyPrefix: message.keyPrefix,
          });
          ws.send(
            JSON.stringify({
              type: 'auth_error',
              error: 'Authentication failed',
            })
          );
          ws.close(4001, 'Authentication failed');
          return;
        }

        // Auth successful - clear timeout and remove auth handler
        clearTimeout(authTimeout);
        ws.removeListener('message', handleAuthMessage);

        // Compute server's HMAC response - proves server has access to stored secret
        const serverHmac = computeHmac(
          agent.secretKey,
          buildServerHmacMessage(message.clientNonce, serverNonce, agent.id)
        );

        // Send success response with server's proof
        ws.send(
          JSON.stringify({
            type: 'auth_success',
            agentId: agent.id,
            clientNonceHmac: serverHmac,
          })
        );

        // Set up authenticated connection
        const connectionId = crypto.randomUUID();
        await this.handleAuthenticatedConnection(ws, { agent, connectionId });
      } catch (err) {
        this.log.error('Auth message error', { err });
        ws.send(
          JSON.stringify({ type: 'auth_error', error: 'Authentication failed' })
        );
        ws.close(4001, 'Authentication failed');
      }
    };

    ws.on('message', handleAuthMessage);

    ws.on('close', () => {
      clearTimeout(authTimeout);
    });

    ws.on('error', (err: Error) => {
      clearTimeout(authTimeout);
      this.log.error('WebSocket error during auth', { err });
    });
  }

  /**
   * Handle an authenticated WebSocket connection from an external agent
   */
  private async handleAuthenticatedConnection(
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

    // Register connection in Redis (use key for UI matching)
    await this.connectionManager.registerConnection(
      agent.userId,
      agent.key,
      connectionId
    );

    this.log.info('External agent connected', {
      agentId: agent.id,
      agentName: agent.name,
    });

    // Ping every 30s to detect stale connections
    const pingInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.ping();
        void this.connectionManager.updatePing(agent.userId, agent.key);
      }
    }, 30000);

    ws.on('pong', () => {
      void this.connectionManager.updatePing(agent.userId, agent.key);
    });

    ws.on('message', async (data: Buffer) => {
      await this.handleMessage(agent, data, messageSequences, messageBuffers);
    });

    ws.on('close', async () => {
      clearInterval(pingInterval);
      this.wsRegistry.unregister(agent.id);
      await this.connectionManager.unregisterConnection(
        agent.userId,
        agent.key
      );
      // Clean up any remaining message tracking on disconnect
      messageSequences.clear();
      messageBuffers.clear();
      this.log.info('External agent disconnected', { agentId: agent.id });
    });

    ws.on('error', (err: Error) => {
      this.log.error('External agent WebSocket error', { err });
    });
  }

  /**
   * Handle a message from an external agent
   */
  private async handleMessage(
    agent: { id: string; key: string; userId: string; name: string },
    data: Buffer,
    messageSequences: Map<string, number>,
    messageBuffers: Map<string, EventBuffer>
  ): Promise<void> {
    try {
      const rawMessage = JSON.parse(data.toString());

      // Validate message with Zod schema
      const parseResult = AgentMessageSchema.safeParse(rawMessage);
      if (!parseResult.success) {
        this.log.warn('Invalid message format from external agent', {
          agentId: agent.id,
          errors: parseResult.error.issues,
          messageType: rawMessage?.type,
        });
        return;
      }

      const message = parseResult.data;

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
        case 'artifact_tool_request': {
          await this.handleArtifactToolRequest(agent, message);
          break;
        }
        case 'server_tool_request': {
          await this.handleServerToolRequest(agent, message);
          break;
        }
      }
    } catch (err) {
      this.log.error('Failed to handle message from external agent', {
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
   * Get session info with caching to reduce DB lookups.
   * Cache entries expire after SESSION_CACHE_TTL_MS.
   */
  private async getSessionCached(
    sessionId: string
  ): Promise<{ orgId: string; userId: string; spawnDepth: number } | null> {
    const now = Date.now();
    const cached = this.sessionCache.get(sessionId);

    // Return cached value if still valid
    if (cached && now - cached.cachedAt < SESSION_CACHE_TTL_MS) {
      return cached.session;
    }

    // Fetch from database
    const session = await this.agentsFeature.sessions.getById(sessionId);
    if (!session) {
      // Remove stale cache entry if session no longer exists
      this.sessionCache.delete(sessionId);
      return null;
    }

    // Cache the session info (spawnDepth defaults to 0 for non-spawned sessions)
    const spawnDepth = session.spawnDepth ?? 0;
    this.sessionCache.set(sessionId, {
      session: { orgId: session.orgId, userId: session.userId, spawnDepth },
      cachedAt: now,
    });

    return { orgId: session.orgId, userId: session.userId, spawnDepth };
  }

  /**
   * Check if an agent has exceeded the rate limit.
   * Uses a sliding window algorithm.
   *
   * @returns true if the request is allowed, false if rate limited
   */
  private checkRateLimit(agentId: string): boolean {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    // Defensive cleanup if map grows too large
    if (this.rateLimitByAgent.size > 10000) {
      this.cleanupStaleCaches();
    }

    let entry = this.rateLimitByAgent.get(agentId);
    if (!entry) {
      entry = { requests: [] };
      this.rateLimitByAgent.set(agentId, entry);
    }

    // Remove expired requests (outside the sliding window)
    entry.requests = entry.requests.filter((ts) => ts > windowStart);

    // Check if under the limit
    if (entry.requests.length >= RATE_LIMIT_MAX_REQUESTS) {
      return false;
    }

    // Add current request
    entry.requests.push(now);
    return true;
  }

  /**
   * Handle an event message from an external agent
   */
  private async handleEventMessage(
    agent: { id: string; key: string; userId: string; name: string },
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

      // Update session usage with extended data from external agent
      if (event.usage) {
        await this.agentsFeature.sessions.updateUsage({
          sessionId,
          promptTokens: event.usage.promptTokens,
          completionTokens: event.usage.completionTokens,
          cacheReadTokens: event.usage.cacheReadTokens,
          cacheWriteTokens: event.usage.cacheWriteTokens,
          latency: event.usage.durationApiMs,
          model: agent.name,
          provider: 'external',
        });
      }

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
          this.log.error('Summarization failed for external agent', { err });
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
      // Clean up tracking for errored message
      messageSequences.delete(messageId);
      messageBuffers.delete(messageId);
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
      // Clean up tracking for interrupted message
      messageSequences.delete(messageId);
      messageBuffers.delete(messageId);
    }

    // Publish event to Redis stream for real-time delivery
    await this.eventStreamManager.publish(sessionId, {
      ...event,
      sessionId,
      messageId,
    });
  }

  /**
   * Handle an artifact tool request from an external agent
   */
  private async handleArtifactToolRequest(
    agent: { id: string; key: string; userId: string; name: string },
    message: {
      requestId: string;
      sessionId: string;
      tool: 'writeArtifact' | 'readArtifact' | 'searchArtifacts';
      params: Record<string, unknown>;
    }
  ): Promise<void> {
    const { requestId, sessionId, tool, params } = message;

    this.log.debug('Handling artifact tool request', {
      agentId: agent.id,
      requestId: requestId.slice(0, 8) + '...',
      tool,
    });

    // Get session to retrieve orgId
    const session = await this.agentsFeature.sessions.getById(sessionId);
    if (!session) {
      this.log.warn('Session not found for artifact tool request', {
        sessionId: sessionId.slice(0, 8) + '...',
      });
      this.sendArtifactToolResponse(
        agent.id,
        sessionId,
        requestId,
        {
          error: 'Session not found',
        },
        true
      );
      return;
    }

    try {
      let result: unknown;

      switch (tool) {
        case 'writeArtifact': {
          const validatedParams = WriteArtifactParamsSchema.parse(params);
          const artifact = await this.artifactsFeature.create({
            userId: agent.userId,
            orgId: session.orgId,
            sessionId,
            agentId: agent.id,
            title: validatedParams.title,
            content: validatedParams.content,
            summary: validatedParams.summary,
          });
          result = {
            success: true,
            artifactId: artifact.id,
            title: artifact.title,
            message: `Document "${artifact.title}" saved successfully.`,
          };
          this.log.info('Artifact created by external agent', {
            agentId: agent.id,
            artifactId: artifact.id,
            title: artifact.title,
          });
          break;
        }

        case 'readArtifact': {
          const validatedParams = ReadArtifactParamsSchema.parse(params);
          const artifact = await this.artifactsFeature.getById({
            id: validatedParams.artifactId,
            userId: agent.userId,
            orgId: session.orgId,
          });
          if (artifact) {
            result = {
              found: true,
              id: artifact.id,
              title: artifact.title,
              content: artifact.content,
              summary: artifact.summary,
              createdAt: artifact.createdAt,
              updatedAt: artifact.updatedAt,
            };
          } else {
            result = {
              found: false,
              message: 'Document not found or access denied.',
            };
          }
          break;
        }

        case 'searchArtifacts': {
          const validatedParams = SearchArtifactsParamsSchema.parse(params);
          const searchResult = await this.artifactsFeature.search({
            userId: agent.userId,
            orgId: session.orgId,
            query: validatedParams.query,
            limit: validatedParams.limit,
            offset: validatedParams.offset,
          });
          result = {
            found: searchResult.results.length > 0,
            count: searchResult.results.length,
            totalCount: searchResult.totalCount,
            results: searchResult.results.map((r) => ({
              id: r.id,
              title: r.title,
              summary: r.summary,
              createdAt: r.createdAt,
            })),
            message:
              searchResult.results.length > 0
                ? `Found ${searchResult.results.length} document(s).`
                : 'No documents found.',
          };
          break;
        }

        default:
          throw new Error(`Unknown artifact tool: ${tool}`);
      }

      this.sendArtifactToolResponse(
        agent.id,
        sessionId,
        requestId,
        result,
        false
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log.error('Artifact tool execution failed', {
        agentId: agent.id,
        tool,
        error: errorMessage,
      });
      this.sendArtifactToolResponse(
        agent.id,
        sessionId,
        requestId,
        {
          error: errorMessage,
        },
        true
      );
    }
  }

  /**
   * Send an artifact tool response back to an external agent
   */
  private sendArtifactToolResponse(
    agentId: string,
    sessionId: string,
    requestId: string,
    result: unknown,
    isError: boolean
  ): void {
    const payload = {
      type: 'artifact_tool_response',
      requestId,
      sessionId,
      result,
      isError,
      timestamp: new Date().toISOString(),
    };

    const sent = this.wsRegistry.sendMessage(agentId, payload);
    if (!sent) {
      this.log.warn(
        'Failed to send artifact tool response - agent not connected',
        {
          agentId,
          requestId: requestId.slice(0, 8) + '...',
        }
      );
    }
  }

  /**
   * Handle a server tool request from an external agent.
   * Uses getToolsById to execute any server-side tool.
   */
  private async handleServerToolRequest(
    agent: { id: string; key: string; userId: string; name: string },
    message: {
      requestId: string;
      sessionId: string;
      messageId?: string;
      toolCallId?: string;
      tool: string;
      params: Record<string, unknown>;
    }
  ): Promise<void> {
    const { requestId, sessionId, messageId, toolCallId, tool, params } = message;

    this.log.debug('Handling server tool request', {
      agentId: agent.id,
      requestId: requestId.slice(0, 8) + '...',
      tool,
    });

    // Check rate limit
    if (!this.checkRateLimit(agent.id)) {
      this.log.warn('Server tool request rate limited', {
        agentId: agent.id,
        requestId: requestId.slice(0, 8) + '...',
        tool,
      });
      this.sendServerToolResponse(
        agent.id,
        sessionId,
        requestId,
        {
          error: `Rate limit exceeded. Max ${RATE_LIMIT_MAX_REQUESTS} requests per minute.`,
        },
        true
      );
      return;
    }

    // Get session to retrieve orgId (uses cache to reduce DB lookups)
    const session = await this.getSessionCached(sessionId);
    if (!session) {
      this.log.warn('Session not found for server tool request', {
        sessionId: sessionId.slice(0, 8) + '...',
      });
      this.sendServerToolResponse(
        agent.id,
        sessionId,
        requestId,
        { error: 'Session not found' },
        true
      );
      return;
    }

    // Verify agent owns this session
    if (session.userId !== agent.userId) {
      this.log.warn('Agent attempted to access session it does not own', {
        agentId: agent.id,
        sessionId: sessionId.slice(0, 8) + '...',
      });
      this.sendServerToolResponse(
        agent.id,
        sessionId,
        requestId,
        { error: 'Unauthorized: session access denied' },
        true
      );
      return;
    }

    try {
      // Build tool context with all available features
      const toolContext = {
        userId: agent.userId,
        orgId: session.orgId,
        sessionId,
        // Use provided messageId for spawn_session_created event association, fallback to requestId
        messageId: messageId || requestId,
        agentId: agent.id,
        artifactsFeature: this.artifactsFeature,
        projectsFeature: this.projectsFeature,
        tasksFeature: this.tasksFeature,
        agentsFeature: this.agentsFeature,
        eventStreamManager: this.eventStreamManager,
        pubsub: this.pubsub,
        // Agent spawning context for sub-agent delegation
        agentSpawner: this.agentSpawner,
        currentSpawnDepth: session.spawnDepth,
        parentAgentKey: agent.key,
      };

      // Get the tool implementation
      const tools = getToolsById([tool], toolContext);
      const toolImpl = tools[tool];

      if (!toolImpl) {
        this.log.warn('Tool not found or not available', {
          tool,
          agentId: agent.id,
        });
        this.sendServerToolResponse(
          agent.id,
          sessionId,
          requestId,
          { error: `Tool '${tool}' not found or not available` },
          true
        );
        return;
      }

      // Execute the tool
      // Pass toolCallId for tools that need it (e.g., spawnAgent)
      // Use provided toolCallId from external agent (matches tool_call_start event), fallback to requestId
      const result = await toolImpl.execute(params, { toolCallId: toolCallId || requestId });

      this.log.debug('Server tool executed successfully', {
        agentId: agent.id,
        tool,
        requestId: requestId.slice(0, 8) + '...',
      });

      this.sendServerToolResponse(
        agent.id,
        sessionId,
        requestId,
        result,
        false
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log.error('Server tool execution failed', {
        agentId: agent.id,
        tool,
        error: errorMessage,
      });
      this.sendServerToolResponse(
        agent.id,
        sessionId,
        requestId,
        { error: errorMessage },
        true
      );
    }
  }

  /**
   * Send a server tool response back to an external agent
   */
  private sendServerToolResponse(
    agentId: string,
    sessionId: string,
    requestId: string,
    result: unknown,
    isError: boolean
  ): void {
    const payload = {
      type: 'server_tool_response',
      requestId,
      sessionId,
      result,
      isError,
      timestamp: new Date().toISOString(),
    };

    const sent = this.wsRegistry.sendMessage(agentId, payload);
    if (!sent) {
      this.log.warn(
        'Failed to send server tool response - agent not connected',
        {
          agentId,
          requestId: requestId.slice(0, 8) + '...',
        }
      );
    }
  }
}

// Event types from external agents
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
      usage?: {
        promptTokens: number;
        completionTokens: number;
        estimatedCost?: number;
        cacheReadTokens?: number;
        cacheWriteTokens?: number;
        durationMs?: number;
        durationApiMs?: number;
        numTurns?: number;
      };
      finishReason?: string;
    }
  | { type: 'error'; code?: string; error: string; retryable?: boolean }
  | { type: 'interrupted' };
