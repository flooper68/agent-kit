import type { AgentsFeature } from '../features/agents';
import type { LocalAgentsFeature } from '../features/local-agents';
import type { JobQueueManager } from './job-queue-manager';
import type { EventStreamManager, StreamEvent } from './event-stream-manager';
import type { StreamingStateManager } from './streaming-state-manager';
import type { LocalAgentWebSocketRegistry } from './local-agent-websocket-registry';
import type { JobRegistryManager } from './job-registry-manager';
import type { CacheInvalidationService } from '../real-time';
import { SPAWN_CONFIG } from './spawn-config';
import { getAvailableAgents as getAvailableAgentsFromBuilder } from './system-prompt-builder';
import { logger } from './logger';

/**
 * Input for both spawn() and spawnAndWait() methods.
 * Can either use an existing session (sessionId) or create a new one (parentSessionId).
 */
export interface SpawnInput {
  /** ID of the agent to spawn */
  agentId: string;
  /** Message to send to the agent */
  message: string;
  /** User ID for ownership */
  userId: string;
  /** Organization ID */
  orgId: string;

  // Session options (provide one):
  /** Use an existing session (for messagesRouter.send) */
  sessionId?: string;
  /** Create new session with parent tracking (for spawnAgent tool) */
  parentSessionId?: string;
  /** Current spawn depth of the parent session */
  parentSpawnDepth?: number;

  /** Timeout in milliseconds (defaults to agent's spawnTimeout or SPAWN_CONFIG.DEFAULT_TIMEOUT_MS) */
  timeout?: number;
  /** Tool call ID from the parent's spawnAgent tool call (for spawn_session_created event) */
  toolCallId?: string;
  /** Message ID in the parent session (for spawn_session_created event) */
  messageId?: string;
}

/**
 * Result from spawn() - fire-and-forget, returns immediately after dispatching
 */
export interface SpawnResult {
  /** ID of the session (existing or newly created) */
  sessionId: string;
  /** Whether the message was successfully dispatched */
  dispatched: boolean;
  /** Error message if dispatch failed */
  error?: string;
}

/**
 * Result from spawnAndWait() - waits for agent completion
 */
export interface SpawnAndWaitResult {
  /** ID of the session */
  sessionId: string;
  /** Complete text response from the spawned agent */
  response: string;
  /** Human-readable name of the spawned agent (for display in UI) */
  agentName?: string;
  /** Token usage if available */
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
  /** How the agent finished */
  finishReason?: 'complete' | 'error' | 'interrupted' | 'timeout';
  /** Error message if finishReason is 'error' */
  error?: string;
}

// Legacy aliases for backwards compatibility
/** @deprecated Use SpawnInput instead */
export type SpawnAgentInput = SpawnInput;
/** @deprecated Use SpawnAndWaitResult instead */
export type SpawnAgentResult = SpawnAndWaitResult;

const log = logger.child({ module: 'agent-spawner' });

/**
 * AgentSpawner - Service for dispatching messages to agents
 *
 * Provides two public methods:
 * - spawn(): Fire-and-forget, dispatches and returns immediately (for messagesRouter.send)
 * - spawnAndWait(): Waits for agent completion (for spawnAgent tool)
 *
 * Both methods can use an existing session (sessionId) or create a new one (parentSessionId).
 */
export class AgentSpawner {
  constructor(
    private agentsFeature: AgentsFeature,
    private localAgentsFeature: LocalAgentsFeature,
    private jobQueueManager: JobQueueManager,
    private eventStreamManager: EventStreamManager,
    private streamingStateManager: StreamingStateManager,
    private localAgentWSRegistry: LocalAgentWebSocketRegistry,
    private cacheInvalidation: CacheInvalidationService,
    private jobRegistryManager: JobRegistryManager
  ) {}

  /**
   * Spawn an agent and wait for its response.
   * Can use existing session (input.sessionId) or create new (input.parentSessionId).
   */
  async spawnAndWait(input: SpawnInput): Promise<SpawnAndWaitResult> {
    const { agentId, message, userId, orgId, toolCallId, messageId } = input;

    // Resolve agent info (validates agent exists and is available)
    const agentInfo = await this.resolveAgentInfo(agentId, userId);
    if ('error' in agentInfo) {
      return {
        sessionId: input.sessionId ?? '',
        response: '',
        finishReason: 'error',
        error: agentInfo.error,
      };
    }

    const { localAgentUuid, resolvedAgentName, isLocalAgent } = agentInfo;

    // Resolve or create session
    const sessionResult = await this.resolveOrCreateSession(
      input,
      isLocalAgent
    );
    if ('error' in sessionResult) {
      return {
        sessionId: '',
        response: '',
        finishReason: 'error',
        error: sessionResult.error,
      };
    }

    const { sessionId, isNewSession } = sessionResult;

    // Determine timeout
    let timeout = input.timeout ?? agentInfo.timeout;
    timeout = Math.max(
      SPAWN_CONFIG.MIN_TIMEOUT_MS,
      Math.min(timeout, SPAWN_CONFIG.MAX_TIMEOUT_MS)
    );

    // Emit spawn_session_created event to the PARENT session so UI can update
    // Only for newly created sessions with parent tracking
    if (isNewSession && input.parentSessionId && toolCallId && messageId) {
      await this.eventStreamManager.publish(input.parentSessionId, {
        type: 'spawn_session_created',
        sessionId: input.parentSessionId,
        messageId,
        toolCallId,
        spawnedSessionId: sessionId,
      } as Omit<
        import('./event-stream-manager').StreamEvent,
        'id' | 'timestamp'
      >);

      log.info('Emitted spawn_session_created event', {
        parentSessionId: input.parentSessionId,
        spawnedSessionId: sessionId,
        toolCallId,
      });
    }

    try {
      // Start streaming state
      await this.streamingStateManager.startStreaming(
        sessionId,
        userId,
        agentId,
        isLocalAgent
      );

      // Dispatch to agent
      if (isLocalAgent) {
        await this.dispatchToLocalAgent(
          sessionId,
          localAgentUuid!,
          message,
          userId
        );
      } else {
        await this.dispatchToServerAgent(
          sessionId,
          agentId,
          message,
          userId,
          orgId
        );
      }

      // Wait for completion
      const result = await this.waitForCompletion(sessionId, timeout);

      // Add agent name to result for UI display
      return {
        ...result,
        agentName: resolvedAgentName,
      };
    } catch (error) {
      log.error('SpawnAndWait failed', {
        sessionId,
        agentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        sessionId,
        response: '',
        agentName: resolvedAgentName,
        finishReason: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      // Stop streaming state
      await this.streamingStateManager.stopStreaming(sessionId);
    }
  }

  /**
   * Dispatch a message to an agent and return immediately (fire-and-forget).
   * Can use existing session (input.sessionId) or create new (input.parentSessionId).
   */
  async spawn(input: SpawnInput): Promise<SpawnResult> {
    const { agentId, message, userId, orgId } = input;

    // Resolve agent info (validates agent exists and is available)
    const agentInfo = await this.resolveAgentInfo(agentId, userId);
    if ('error' in agentInfo) {
      return {
        sessionId: input.sessionId ?? '',
        dispatched: false,
        error: agentInfo.error,
      };
    }

    const { localAgentUuid, isLocalAgent } = agentInfo;

    // Resolve or create session
    const sessionResult = await this.resolveOrCreateSession(
      input,
      isLocalAgent
    );
    if ('error' in sessionResult) {
      return {
        sessionId: '',
        dispatched: false,
        error: sessionResult.error,
      };
    }

    const { sessionId } = sessionResult;

    try {
      // Start streaming state
      await this.streamingStateManager.startStreaming(
        sessionId,
        userId,
        agentId,
        isLocalAgent
      );

      // Dispatch to agent
      if (isLocalAgent) {
        await this.dispatchToLocalAgent(
          sessionId,
          localAgentUuid!,
          message,
          userId
        );
      } else {
        await this.dispatchToServerAgent(
          sessionId,
          agentId,
          message,
          userId,
          orgId
        );
      }

      return { sessionId, dispatched: true };
    } catch (error) {
      // Clean up streaming state on failure
      await this.streamingStateManager.stopStreaming(sessionId);

      log.error('Spawn failed', {
        sessionId,
        agentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        sessionId,
        dispatched: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Resolve agent info - validates agent exists and is available
   */
  private async resolveAgentInfo(
    agentId: string,
    userId: string
  ): Promise<
    | {
        localAgentUuid: string | undefined;
        resolvedAgentName: string | undefined;
        isLocalAgent: boolean;
        timeout: number;
      }
    | { error: string }
  > {
    let timeout: number = SPAWN_CONFIG.DEFAULT_TIMEOUT_MS;
    let localAgentUuid: string | undefined;
    let resolvedAgentName: string | undefined;
    let isLocalAgent = false;

    // Auto-detect agent type: first check built-in, then local
    const builtInAgent = this.agentsFeature.agents.get(agentId);
    if (builtInAgent) {
      // Found as built-in agent
      if (builtInAgent.spawnTimeout) {
        timeout = builtInAgent.spawnTimeout;
      }
      resolvedAgentName = builtInAgent.name;
      isLocalAgent = false;
    } else {
      // Not a built-in agent, check if it's a local agent by key
      const localAgent = await this.localAgentsFeature.getByKey(
        agentId,
        userId
      );
      if (!localAgent) {
        return {
          error: `Agent not found: ${agentId}. Check that the agent ID is correct and the agent is available.`,
        };
      }
      if (localAgent.disabled) {
        return { error: `Local agent is disabled: ${agentId}` };
      }

      // Check if local agent is connected (using UUID for WebSocket registry)
      if (!this.localAgentWSRegistry.isConnected(localAgent.id)) {
        return { error: `Local agent is not connected: ${agentId}` };
      }

      // Store UUID and name for later use
      localAgentUuid = localAgent.id;
      resolvedAgentName = localAgent.name;
      isLocalAgent = true;
    }

    return { localAgentUuid, resolvedAgentName, isLocalAgent, timeout };
  }

  /**
   * Resolve or create session based on input
   */
  private async resolveOrCreateSession(
    input: SpawnInput,
    isLocalAgent: boolean
  ): Promise<{ sessionId: string; isNewSession: boolean } | { error: string }> {
    // If sessionId provided, use existing session
    if (input.sessionId) {
      return { sessionId: input.sessionId, isNewSession: false };
    }

    // Otherwise create new session
    const newSpawnDepth = (input.parentSpawnDepth ?? 0) + 1;

    // Validate spawn depth (only for new sessions)
    if (newSpawnDepth > SPAWN_CONFIG.MAX_SPAWN_DEPTH) {
      return {
        error: `Maximum spawn depth of ${SPAWN_CONFIG.MAX_SPAWN_DEPTH} exceeded`,
      };
    }

    log.info('Creating new session for agent', {
      agentId: input.agentId,
      parentSessionId: input.parentSessionId,
      spawnDepth: newSpawnDepth,
      isLocalAgent,
    });

    const session = await this.agentsFeature.sessions.create({
      userId: input.userId,
      orgId: input.orgId,
      agentId: input.agentId,
      isLocalAgent,
      parentSessionId: input.parentSessionId,
      spawnDepth: newSpawnDepth,
      title: `Spawned from ${input.parentSessionId ?? 'root'}`,
    });

    return { sessionId: session.id, isNewSession: true };
  }

  /**
   * Dispatch message to local agent via WebSocket
   */
  private async dispatchToLocalAgent(
    sessionId: string,
    localAgentUuid: string,
    message: string,
    userId: string
  ): Promise<void> {
    // Create user message + assistant placeholder
    const { userMessageId, assistantMessageId } =
      await this.agentsFeature.messageLifecycle.sendUserMessage({
        sessionId,
        content: message,
      });

    // Publish user message created event
    await this.eventStreamManager.publish(sessionId, {
      type: 'user_message_created',
      sessionId,
      messageId: userMessageId,
      content: message,
    } as Omit<StreamEvent, 'id' | 'timestamp'>);

    // Publish cache invalidation
    await this.cacheInvalidation.publishSessionMessageAdded(userId, sessionId);

    // Fetch session history for local agent
    const sessionHistory =
      await this.agentsFeature.sessions.getMessagesAndEvents(sessionId);

    if (!sessionHistory) {
      throw new Error('Failed to fetch session history');
    }

    // Send to local agent via WebSocket (using UUID for registry lookup)
    const sent = this.localAgentWSRegistry.sendMessage(localAgentUuid, {
      type: 'user_message',
      sessionId,
      messageId: assistantMessageId,
      userMessageId,
      content: message,
      userId,
      timestamp: new Date().toISOString(),
      messages: sessionHistory.messages,
      events: sessionHistory.events,
    });

    if (!sent) {
      // Rollback assistant message on failure
      await this.agentsFeature.messages.updateStatus({
        messageId: assistantMessageId,
        status: 'error',
      });
      throw new Error('Local agent is not connected');
    }
  }

  /**
   * Dispatch message to server agent via job queue
   */
  private async dispatchToServerAgent(
    sessionId: string,
    agentId: string,
    message: string,
    userId: string,
    orgId: string
  ): Promise<void> {
    // Enqueue job for processing
    await this.jobQueueManager.enqueue({
      sessionId,
      agentId,
      userId,
      orgId,
      content: message,
    });

    // Publish cache invalidation
    await this.cacheInvalidation.publishSessionMessageAdded(userId, sessionId);
  }

  /**
   * Wait for agent completion by subscribing to event stream
   */
  private async waitForCompletion(
    sessionId: string,
    timeout: number
  ): Promise<SpawnAndWaitResult> {
    return new Promise((resolve) => {
      // Track text in segments - only return the final segment (after last tool call)
      let currentTextSegment = '';
      let lastTextSegment = '';
      let usage: { promptTokens: number; completionTokens: number } | undefined;
      let finishReason: SpawnAndWaitResult['finishReason'] = 'complete';
      let errorMessage: string | undefined;
      let resolved = false;

      // AbortController to terminate the subscription when done
      const abortController = new AbortController();

      // Timeout ID - declared here so finish() can clear it
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      const finish = () => {
        if (resolved) return;
        resolved = true;

        // Always clear timeout to prevent memory leaks
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = undefined;
        }

        // Signal the subscription to terminate
        abortController.abort();

        // Use final segment, or fall back to last segment if agent ended on a tool call
        const finalResponse =
          currentTextSegment.trim() || lastTextSegment.trim();

        resolve({
          sessionId,
          response: finalResponse,
          usage,
          finishReason,
          error: errorMessage,
        });
      };

      // Set up timeout with interrupt request
      timeoutId = setTimeout(async () => {
        if (resolved) return;
        finishReason = 'timeout';
        errorMessage = `Agent did not respond within ${timeout}ms`;

        // Request interruption of the spawned agent
        try {
          await this.jobRegistryManager.requestInterrupt(sessionId);
          log.info('Requested interrupt for timed out spawned agent', {
            sessionId,
          });
        } catch (interruptError) {
          log.warn('Failed to request interrupt for timed out agent', {
            sessionId,
            error:
              interruptError instanceof Error
                ? interruptError.message
                : 'Unknown error',
          });
        }

        finish();
      }, timeout);

      // Subscribe to events
      const processEvents = async () => {
        try {
          const eventStream = this.eventStreamManager.subscribe(
            sessionId,
            undefined,
            false,
            abortController.signal
          );

          for await (const event of eventStream) {
            if (resolved) break;

            switch (event.type) {
              case 'tool_call_start':
                // Tool call starting - save current segment and reset for new segment
                if (currentTextSegment.trim()) {
                  lastTextSegment = currentTextSegment;
                }
                currentTextSegment = '';
                break;

              case 'text_delta':
                currentTextSegment += event.delta;
                break;

              case 'message_complete':
                if (event.usage) {
                  usage = {
                    promptTokens: event.usage.promptTokens,
                    completionTokens: event.usage.completionTokens,
                  };
                }
                finishReason = 'complete';
                finish();
                return;

              case 'error':
                finishReason = 'error';
                errorMessage = event.error;
                finish();
                return;

              case 'interrupted':
                finishReason = 'interrupted';
                finish();
                return;
            }
          }
        } catch (error) {
          if (!resolved) {
            finishReason = 'error';
            errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            finish();
          }
        }
      };

      // Run processEvents and catch any unhandled errors
      processEvents().catch((error) => {
        if (!resolved) {
          finishReason = 'error';
          errorMessage =
            error instanceof Error
              ? error.message
              : 'Unknown subscription error';
          finish();
        }
      });
    });
  }

  /**
   * Get all available agents for spawning (built-in + local)
   * Delegates to shared implementation in system-prompt-builder
   */
  async getAvailableAgents(
    userId: string
  ): Promise<
    Array<{ id: string; name: string; description: string; isLocal: boolean }>
  > {
    return getAvailableAgentsFromBuilder(
      this.agentsFeature,
      this.localAgentsFeature,
      userId
    );
  }
}
