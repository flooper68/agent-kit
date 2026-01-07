import type { AgentsFeature } from '../features/agents';
import type { LocalAgentsFeature } from '../features/local-agents';
import type { JobQueueManager } from './job-queue-manager';
import type { EventStreamManager, StreamEvent } from './event-stream-manager';
import type { StreamingStateManager } from './streaming-state-manager';
import type { LocalAgentWebSocketRegistry } from './local-agent-websocket-registry';
import type { CacheInvalidationService } from '../real-time';
import { SPAWN_CONFIG } from './spawn-config';
import { logger } from './logger';

export interface SpawnAgentInput {
  /** ID of the agent to spawn */
  agentId: string;
  /** Message to send to the spawned agent */
  message: string;
  /** User ID for ownership */
  userId: string;
  /** Organization ID */
  orgId: string;
  /** Parent session ID for hierarchy tracking */
  parentSessionId?: string;
  /** Current spawn depth of the parent session */
  parentSpawnDepth?: number;
  /** Timeout in milliseconds (defaults to agent's spawnTimeout or SPAWN_CONFIG.DEFAULT_TIMEOUT_MS) */
  timeout?: number;
  /** Whether this is a local agent */
  isLocalAgent?: boolean;
}

export interface SpawnAgentResult {
  /** ID of the created session */
  sessionId: string;
  /** Complete text response from the spawned agent */
  response: string;
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

const log = logger.child({ module: 'agent-spawner' });

/**
 * AgentSpawner - Service for spawning agents and waiting for their responses
 *
 * This service abstracts the logic for spawning agents, used by both:
 * - The spawnAgent tool (waits for completion)
 * - Potentially other internal use cases
 */
export class AgentSpawner {
  constructor(
    private agentsFeature: AgentsFeature,
    private localAgentsFeature: LocalAgentsFeature,
    private jobQueueManager: JobQueueManager,
    private eventStreamManager: EventStreamManager,
    private streamingStateManager: StreamingStateManager,
    private localAgentWSRegistry: LocalAgentWebSocketRegistry,
    private cacheInvalidation: CacheInvalidationService
  ) {}

  /**
   * Spawn an agent and wait for its response
   */
  async spawn(input: SpawnAgentInput): Promise<SpawnAgentResult> {
    const {
      agentId,
      message,
      userId,
      orgId,
      parentSessionId,
      parentSpawnDepth = 0,
      isLocalAgent = false,
    } = input;

    const newSpawnDepth = parentSpawnDepth + 1;

    // Validate spawn depth
    if (newSpawnDepth > SPAWN_CONFIG.MAX_SPAWN_DEPTH) {
      return {
        sessionId: '',
        response: '',
        finishReason: 'error',
        error: `Maximum spawn depth of ${SPAWN_CONFIG.MAX_SPAWN_DEPTH} exceeded`,
      };
    }

    // Determine timeout
    let timeout = input.timeout ?? SPAWN_CONFIG.DEFAULT_TIMEOUT_MS;

    // Get agent-specific timeout if available (for built-in agents)
    if (!isLocalAgent) {
      const agent = this.agentsFeature.agents.get(agentId);
      if (!agent) {
        return {
          sessionId: '',
          response: '',
          finishReason: 'error',
          error: `Agent not found: ${agentId}`,
        };
      }
      if (agent.spawnTimeout) {
        timeout = agent.spawnTimeout;
      }
    } else {
      // Validate local agent exists and is not disabled
      const localAgent = await this.localAgentsFeature.getById(agentId, userId);
      if (!localAgent) {
        return {
          sessionId: '',
          response: '',
          finishReason: 'error',
          error: `Local agent not found: ${agentId}`,
        };
      }
      if (localAgent.disabled) {
        return {
          sessionId: '',
          response: '',
          finishReason: 'error',
          error: `Local agent is disabled: ${agentId}`,
        };
      }

      // Check if local agent is connected
      if (!this.localAgentWSRegistry.isConnected(agentId)) {
        return {
          sessionId: '',
          response: '',
          finishReason: 'error',
          error: `Local agent is not connected: ${agentId}`,
        };
      }
    }

    // Clamp timeout to valid range
    timeout = Math.max(
      SPAWN_CONFIG.MIN_TIMEOUT_MS,
      Math.min(timeout, SPAWN_CONFIG.MAX_TIMEOUT_MS)
    );

    log.info('Spawning agent', {
      agentId,
      parentSessionId,
      spawnDepth: newSpawnDepth,
      timeout,
      isLocalAgent,
    });

    // Create new session with parent tracking
    const session = await this.agentsFeature.sessions.create({
      userId,
      orgId,
      agentId,
      isLocalAgent,
      parentSessionId,
      spawnDepth: newSpawnDepth,
      title: `Spawned from ${parentSessionId ?? 'root'}`,
    });

    const sessionId = session.id;

    try {
      // Start streaming state
      await this.streamingStateManager.startStreaming(
        sessionId,
        userId,
        agentId,
        isLocalAgent
      );

      if (isLocalAgent) {
        // Handle local agent spawn
        return await this.spawnLocalAgent(
          sessionId,
          agentId,
          message,
          userId,
          timeout
        );
      } else {
        // Handle server agent spawn
        return await this.spawnServerAgent(
          sessionId,
          agentId,
          message,
          userId,
          orgId,
          timeout
        );
      }
    } catch (error) {
      log.error('Spawn failed', {
        sessionId,
        agentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        sessionId,
        response: '',
        finishReason: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      // Stop streaming state
      await this.streamingStateManager.stopStreaming(sessionId);
    }
  }

  /**
   * Spawn a server agent and wait for response
   */
  private async spawnServerAgent(
    sessionId: string,
    agentId: string,
    message: string,
    userId: string,
    orgId: string,
    timeout: number
  ): Promise<SpawnAgentResult> {
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

    // Wait for completion
    return this.waitForCompletion(sessionId, timeout);
  }

  /**
   * Spawn a local agent and wait for response
   */
  private async spawnLocalAgent(
    sessionId: string,
    agentId: string,
    message: string,
    userId: string,
    timeout: number
  ): Promise<SpawnAgentResult> {
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

    // Fetch session history for local agent
    const sessionHistory =
      await this.agentsFeature.sessions.getMessagesAndEvents(sessionId);

    if (!sessionHistory) {
      throw new Error('Failed to fetch session history');
    }

    // Send to local agent via WebSocket
    const sent = this.localAgentWSRegistry.sendMessage(agentId, {
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

    // Wait for completion
    return this.waitForCompletion(sessionId, timeout);
  }

  /**
   * Wait for agent completion by subscribing to event stream
   */
  private async waitForCompletion(
    sessionId: string,
    timeout: number
  ): Promise<SpawnAgentResult> {
    return new Promise((resolve) => {
      let textContent = '';
      let usage: { promptTokens: number; completionTokens: number } | undefined;
      let finishReason: SpawnAgentResult['finishReason'] = 'complete';
      let errorMessage: string | undefined;
      let resolved = false;

      const finish = () => {
        if (resolved) return;
        resolved = true;

        resolve({
          sessionId,
          response: textContent.trim(),
          usage,
          finishReason,
          error: errorMessage,
        });
      };

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (resolved) return;
        finishReason = 'timeout';
        errorMessage = `Agent did not respond within ${timeout}ms`;
        finish();
      }, timeout);

      // Subscribe to events
      const processEvents = async () => {
        try {
          const eventStream = this.eventStreamManager.subscribe(sessionId);

          for await (const event of eventStream) {
            if (resolved) break;

            switch (event.type) {
              case 'text_delta':
                textContent += event.delta;
                break;

              case 'message_complete':
                if (event.usage) {
                  usage = {
                    promptTokens: event.usage.promptTokens,
                    completionTokens: event.usage.completionTokens,
                  };
                }
                finishReason = 'complete';
                clearTimeout(timeoutId);
                finish();
                return;

              case 'error':
                finishReason = 'error';
                errorMessage = event.error;
                clearTimeout(timeoutId);
                finish();
                return;

              case 'interrupted':
                finishReason = 'interrupted';
                clearTimeout(timeoutId);
                finish();
                return;
            }
          }
        } catch (error) {
          if (!resolved) {
            finishReason = 'error';
            errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            clearTimeout(timeoutId);
            finish();
          }
        }
      };

      processEvents();
    });
  }

  /**
   * Get all available agents for spawning (built-in + local)
   */
  async getAvailableAgents(
    userId: string
  ): Promise<
    Array<{ id: string; name: string; description: string; isLocal: boolean }>
  > {
    // Get built-in agents
    const builtInAgents = this.agentsFeature.agents.list().map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      isLocal: false,
    }));

    // Get local agents
    const localAgents = await this.localAgentsFeature.list(userId);
    const activeLocalAgents = localAgents
      .filter((agent) => !agent.disabled)
      .map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description ?? 'Local agent',
        isLocal: true,
      }));

    return [...builtInAgents, ...activeLocalAgents];
  }
}
