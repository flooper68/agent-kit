import type { EventStreamManager, StreamEvent } from './event-stream-manager';
import type { JobRegistryManager } from './job-registry-manager';
import type { StreamingStateManager } from './streaming-state-manager';
import { STREAMING_HEARTBEAT_INTERVAL_MS } from './streaming-state-manager';
import type { AgentJob } from './job-queue-manager';
import type { PubSubManager, CacheInvalidationService } from '../real-time';
import type { MessagePart } from '../db/schema/agent-session-messages';
import type { AgentsFeature } from '../features/agents';
import type { ArtifactsFeature } from '../features/artifacts';
import type { ProjectsFeature } from '../features/projects';
import type { TasksFeature } from '../features/tasks';
import type { SkillsFeature } from '../features/skills';
import type { AgentSpawner } from './agent-spawner';
import { getProvider } from './providers';
import { getToolsById } from './tools';
import { buildSystemPrompt } from './system-prompt-builder';
import { getModelInfo } from './model-config';
import type {
  ProviderStreamEvent,
  Message,
  AssistantContentPart,
  ToolResultOutput,
  AgentDefinition,
} from './types';
import type { AgentError } from './errors';
import { classifyError } from './errors';
import { logger } from './logger';
import { calculateCost } from '../features/agents/pricing';
import { EventBuffer } from './event-buffer';
import { calculateTokenBreakdown, type TokenBreakdown } from '../lib/tokenizer';
import type { ThinkingConfig } from '../db/schema/agents';

export interface DbMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: MessagePart[];
}

/**
 * Handles the execution of a single agent job
 * Manages streaming, event persistence, and error handling
 */
export class AgentJobHandler {
  private eventStreamManager: EventStreamManager;
  private jobRegistryManager: JobRegistryManager;
  private streamingStateManager: StreamingStateManager;
  private agentsFeature: AgentsFeature;
  private artifactsFeature: ArtifactsFeature;
  private skillsFeature: SkillsFeature;
  private agentSpawner: AgentSpawner;
  private pubsub: PubSubManager;
  private cacheInvalidation: CacheInvalidationService;
  private projectsFeature?: ProjectsFeature;
  private tasksFeature?: TasksFeature;
  private workerId: string;
  private eventSequence = 0;
  private eventBuffer = new EventBuffer();
  private log: ReturnType<typeof logger.child>;

  constructor(
    eventStreamManager: EventStreamManager,
    jobRegistryManager: JobRegistryManager,
    streamingStateManager: StreamingStateManager,
    agentsFeature: AgentsFeature,
    artifactsFeature: ArtifactsFeature,
    skillsFeature: SkillsFeature,
    agentSpawner: AgentSpawner,
    pubsub: PubSubManager,
    cacheInvalidation: CacheInvalidationService,
    workerId: string,
    projectsFeature?: ProjectsFeature,
    tasksFeature?: TasksFeature
  ) {
    this.eventStreamManager = eventStreamManager;
    this.jobRegistryManager = jobRegistryManager;
    this.streamingStateManager = streamingStateManager;
    this.agentsFeature = agentsFeature;
    this.artifactsFeature = artifactsFeature;
    this.skillsFeature = skillsFeature;
    this.agentSpawner = agentSpawner;
    this.pubsub = pubsub;
    this.cacheInvalidation = cacheInvalidation;
    this.workerId = workerId;
    this.projectsFeature = projectsFeature;
    this.tasksFeature = tasksFeature;
    this.log = logger.child({ workerId });
  }

  /**
   * Process a single agent job
   */
  async handle(job: AgentJob): Promise<void> {
    // Reset state at the start of each job to prevent stale data accumulation
    this.eventSequence = 0;
    this.eventBuffer = new EventBuffer();

    const { sessionId, agentId, userId, orgId, content } = job;

    // Create user message and assistant placeholder using shared command
    const { userMessageId, assistantMessageId } =
      await this.agentsFeature.messageLifecycle.sendUserMessage({
        sessionId,
        content,
      });

    // Publish user_message_created event so client can update optimistic message
    await this.eventStreamManager.publish(sessionId, {
      type: 'user_message_created',
      sessionId,
      messageId: userMessageId,
      content,
    } as Omit<StreamEvent, 'id' | 'timestamp'>);

    const messageId = assistantMessageId;

    // Get session info for spawn depth and local agent flag
    const session = await this.agentsFeature.sessions.getById(sessionId);
    const currentSpawnDepth = session?.spawnDepth ?? 0;
    const isLocalAgent = session?.isLocalAgent ?? false;

    // Get agent definition from custom agents
    let agent: AgentDefinition | null = null;
    let modelSettings: {
      temperature?: number;
      maxTokens?: number;
      thinkingConfig?: ThinkingConfig;
    } = {};
    let maxContextTokens: number | undefined;

    // Fetch custom agent by key (agentId is the key for custom agents)
    const customAgentResult = await this.agentsFeature.customAgents.getByKey(
      agentId,
      userId
    );
    // Only server agents can be run directly (external agents connect via WebSocket)
    if (customAgentResult?.type === 'server') {
      const customAgent = customAgentResult.agent;
      if (!customAgent.disabled) {
        // Build agent definition from server agent config
        agent = {
          id: customAgent.key,
          name: customAgent.name,
          description: customAgent.description ?? '',
          systemPrompt: customAgent.systemPrompt,
          provider: customAgent.provider,
          model: customAgent.model,
          tools: customAgent.tools,
        };
        // Capture model settings from agent config
        modelSettings = {
          temperature: customAgent.temperature ?? undefined,
          maxTokens: customAgent.maxOutputTokens ?? undefined,
          thinkingConfig: customAgent.thinkingConfig ?? undefined,
        };
        // Capture max context tokens (use agent's setting or model's default)
        if (customAgent.maxContextTokens) {
          maxContextTokens = customAgent.maxContextTokens;
        } else {
          const modelInfo = getModelInfo(customAgent.model);
          maxContextTokens = modelInfo?.contextWindow;
        }
      }
    }

    if (!agent) {
      this.log.error('Agent not found', { sessionId, agentId, isLocalAgent });
      await this.agentsFeature.messages.updateStatus({
        messageId,
        status: 'error',
      });
      await this.publishError(sessionId, messageId, {
        code: 'SESSION_ERROR',
        message: `Agent not found: ${agentId}`,
        retryable: false,
      });
      return;
    }

    // Fetch allowed skills for this agent
    const allowedSkills = await this.agentsFeature.permissions.getAllowedSkills(
      agentId,
      userId,
      orgId
    );
    const allowedSkillIds = allowedSkills.map((s) => s.id);

    this.log.info('Starting job', {
      sessionId,
      model: agent.model,
      provider: agent.provider,
      isLocalAgent,
      allowedSkillsCount: allowedSkills.length,
    });

    // Build system prompt with available agents and skills
    const systemPrompt = await buildSystemPrompt(
      agent.systemPrompt,
      this.agentsFeature,
      userId,
      true,
      allowedSkills,
      agentId
    );

    // Get provider
    const provider = getProvider(agent.provider);
    if (!provider) {
      this.log.error('Provider not found', {
        sessionId,
        provider: agent.provider,
      });
      await this.agentsFeature.messages.updateStatus({
        messageId,
        status: 'error',
      });
      await this.publishError(sessionId, messageId, {
        code: 'PROVIDER_ERROR',
        message: `Provider not found: ${agent.provider}`,
        retryable: false,
      });
      return;
    }

    // Register job for interruption tracking (includes messageId for immediate interrupt event)
    await this.jobRegistryManager.register(sessionId, this.workerId, messageId);

    // Note: startStreaming is already called in messages.send router
    // This ensures streaming state is set immediately when user sends message
    // (not delayed until worker picks up the job)

    try {
      // Update message status to streaming
      await this.agentsFeature.messages.updateStatus({
        messageId,
        status: 'streaming',
      });

      // Get conversation history
      const dbMessages =
        await this.agentsFeature.messages.getBySessionId(sessionId);
      const messages = convertToAIMessages(dbMessages);

      // Check context limit before processing
      if (maxContextTokens && session?.usage) {
        const sessionUsage = session.usage as {
          currentContextTokens?: number;
        };
        const currentContext = sessionUsage.currentContextTokens ?? 0;
        if (currentContext >= maxContextTokens) {
          this.log.warn('Context limit reached', {
            sessionId,
            currentContext,
            maxContextTokens,
          });
          await this.agentsFeature.messages.updateStatus({
            messageId,
            status: 'error',
          });
          await this.publishError(sessionId, messageId, {
            code: 'CONTEXT_LIMIT_REACHED',
            message: `Context limit reached (${Math.round(currentContext / 1000)}K / ${Math.round(maxContextTokens / 1000)}K tokens). Please start a new conversation.`,
            retryable: false,
          });
          return;
        }
      }

      // Get agent scopes for permission checks
      const agentScopes = customAgentResult?.agent?.scopes ?? [];

      // Get tools for this agent (with context for artifact, planning, client-side, spawn, and agent management tools)
      const toolContext = {
        userId,
        orgId,
        sessionId,
        messageId,
        agentId,
        artifactsFeature: this.artifactsFeature,
        projectsFeature: this.projectsFeature,
        tasksFeature: this.tasksFeature,
        agentsFeature: this.agentsFeature,
        skillsFeature: this.skillsFeature,
        eventStreamManager: this.eventStreamManager,
        pubsub: this.pubsub,
        agentSpawner: this.agentSpawner,
        currentSpawnDepth,
        parentAgentKey: agentId, // Agent key for spawn validation
        allowedSkillIds, // Skill filtering
        allowedToolIds: agent.tools, // Tool access control for executeCommand
        agentScopes, // Permission scopes for action access control
      };
      const tools = getToolsById(agent.tools, toolContext);

      // Publish message start event
      await this.eventStreamManager.publish(sessionId, {
        type: 'message_start',
        sessionId,
        messageId,
      } as Omit<StreamEvent, 'id' | 'timestamp'>);

      // Create abort controller for interruption
      const abortController = new AbortController();

      // Stream the response
      const stream = provider.createStream({
        model: agent.model,
        systemPrompt,
        messages,
        tools,
        abortSignal: abortController.signal,
        ...modelSettings,
      });

      // Track start time for latency calculation
      const startTime = Date.now();

      let finalStatus: 'complete' | 'error' | 'interrupted' = 'complete';
      let finalMetadata:
        | {
            tokensUsed?: number;
            finishReason?: string;
            contextTokens?: number;
            cacheReadTokens?: number;
            cacheWriteTokens?: number;
            contextBreakdown?: TokenBreakdown;
          }
        | undefined;
      let finalUsage:
        | {
            promptTokens: number;
            completionTokens: number;
            cacheReadTokens?: number;
            cacheWriteTokens?: number;
            contextWindowUsage?: number;
            tokenBreakdown?: TokenBreakdown;
          }
        | undefined;

      // Track last heartbeat time for streaming state TTL refresh
      let lastHeartbeat = Date.now();

      for await (const event of stream) {
        // Send heartbeat to keep streaming state alive during long streams
        if (Date.now() - lastHeartbeat > STREAMING_HEARTBEAT_INTERVAL_MS) {
          await this.streamingStateManager.sendHeartbeat(sessionId);
          lastHeartbeat = Date.now();
        }

        // Check for interrupt
        if (await this.jobRegistryManager.isInterrupted(sessionId)) {
          this.log.info('Interrupted by user', { sessionId, messageId });
          abortController.abort();
          finalStatus = 'interrupted';
          // Flush any buffered events before interruption
          await this.flushBuffer(sessionId, messageId);
          await this.publishInterrupted(sessionId, messageId);
          break;
        }

        // Write event to database and publish to Redis
        const sequence = this.eventSequence++;
        await this.handleProviderEvent(
          event,
          sessionId,
          messageId,
          sequence,
          agent.model
        );

        // Capture final metadata from done event
        if (event.type === 'done') {
          // Recalculate token breakdown now that streaming is complete
          // This captures the full conversation including tool results from this turn
          const updatedDbMessages =
            await this.agentsFeature.messages.getBySessionId(sessionId);
          const updatedMessages = convertToAIMessages(updatedDbMessages);
          const finalTokenBreakdown = calculateTokenBreakdown({
            systemPrompt: agent.systemPrompt,
            tools: tools as Record<string, unknown>,
            messages: updatedMessages as Array<{
              role: string;
              content: unknown;
            }>,
          });

          // Calculate context window usage from breakdown (more accurate than provider's count
          // which includes repeated tokens from multiple tool call rounds)
          const contextWindowUsage =
            finalTokenBreakdown.systemPrompt +
            finalTokenBreakdown.toolDefinitions +
            finalTokenBreakdown.conversationHistory +
            finalTokenBreakdown.toolResults +
            finalTokenBreakdown.userInput;

          finalMetadata = {
            tokensUsed: event.usage
              ? event.usage.promptTokens + event.usage.completionTokens
              : undefined,
            finishReason: event.finishReason,
            // Store context tracking per-message (use breakdown total for accurate context window usage)
            contextTokens: contextWindowUsage,
            cacheReadTokens: event.usage?.cacheReadTokens,
            cacheWriteTokens: event.usage?.cacheWriteTokens,
            // Include context breakdown for this message
            contextBreakdown: finalTokenBreakdown,
          };

          if (event.usage) {
            finalUsage = {
              promptTokens: event.usage.promptTokens,
              completionTokens: event.usage.completionTokens,
              cacheReadTokens: event.usage.cacheReadTokens,
              cacheWriteTokens: event.usage.cacheWriteTokens,
              // Context window usage from breakdown
              contextWindowUsage,
              // Include token breakdown for session usage (with completion tokens)
              tokenBreakdown: {
                ...finalTokenBreakdown,
                completion: event.usage.completionTokens,
              },
            };
          }
        }

        if (event.type === 'error') {
          finalStatus = 'error';
        }
      }

      // Calculate latency
      const latency = Date.now() - startTime;

      // Update message status and session usage via completeMessage
      const completeResult =
        await this.agentsFeature.messageLifecycle.completeMessage({
          messageId,
          sessionId,
          status: finalStatus,
          metadata: finalMetadata,
          usage: finalUsage,
          latency,
          model: agent.model,
          provider: agent.provider,
        });

      // Trigger summarization for successful completions (fire-and-forget)
      if (finalStatus === 'complete' && completeResult.messageCount) {
        this.agentsFeature.summarization
          .trigger({
            sessionId,
            messageCount: completeResult.messageCount,
            userId,
          })
          .catch((err) => {
            this.log.error('Summarization trigger failed', {
              sessionId,
              error: err instanceof Error ? err.message : 'Unknown error',
            });
          });
      }
    } catch (error) {
      const agentError = classifyError(error);
      this.log.error('Job failed', {
        sessionId,
        messageId,
        code: agentError.code,
        statusCode: agentError.details?.statusCode,
      });
      // Flush any buffered events before marking as error
      await this.flushBuffer(sessionId, messageId);
      await this.agentsFeature.messages.updateStatus({
        messageId,
        status: 'error',
      });
      await this.publishError(sessionId, messageId, agentError);
    } finally {
      await this.jobRegistryManager.unregister(sessionId);
      // Stop streaming state - publishes streaming_state_changed event
      await this.streamingStateManager.stopStreaming(sessionId);
    }
  }

  /**
   * Handle a provider stream event - persist to DB and publish to Redis
   */
  private async handleProviderEvent(
    event: ProviderStreamEvent,
    sessionId: string,
    messageId: string,
    sequence: number,
    model: string
  ): Promise<void> {
    switch (event.type) {
      case 'text_delta': {
        // Buffer consecutive text deltas to reduce DB writes
        const toFlush = this.eventBuffer.add(
          { type: 'text_delta', content: event.content },
          sequence
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
        // Always publish immediately for real-time streaming
        await this.eventStreamManager.publish(sessionId, {
          type: 'text_delta',
          sessionId,
          messageId,
          delta: event.content,
        } as Omit<StreamEvent, 'id' | 'timestamp'>);
        break;
      }

      case 'reasoning_delta': {
        // Buffer consecutive reasoning deltas to reduce DB writes
        const toFlush = this.eventBuffer.add(
          { type: 'reasoning_delta', content: event.content },
          sequence
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
        // Always publish immediately for real-time streaming
        await this.eventStreamManager.publish(sessionId, {
          type: 'reasoning_delta',
          sessionId,
          messageId,
          delta: event.content,
        } as Omit<StreamEvent, 'id' | 'timestamp'>);
        break;
      }

      case 'tool_call':
        // Flush any buffered deltas before tool call
        await this.flushBuffer(sessionId, messageId);
        this.log.debug('Tool call', {
          sessionId,
          toolName: event.toolName,
          toolCallId: event.toolCallId,
        });

        await this.agentsFeature.events.insert({
          sessionId,
          messageId,
          sequence,
          type: 'tool_call',
          toolCallId: event.toolCallId,
          toolName: event.toolName,
          toolArgs: event.args,
        });
        await this.eventStreamManager.publish(sessionId, {
          type: 'tool_call_start',
          sessionId,
          messageId,
          toolCallId: event.toolCallId,
          toolName: event.toolName,
          toolArgs: event.args,
        } as Omit<StreamEvent, 'id' | 'timestamp'>);
        break;

      case 'tool_result':
        // Flush any buffered deltas before tool result
        await this.flushBuffer(sessionId, messageId);
        this.log.debug('Tool result', {
          sessionId,
          toolCallId: event.toolCallId,
        });
        await this.agentsFeature.events.insert({
          sessionId,
          messageId,
          sequence,
          type: 'tool_result',
          toolCallId: event.toolCallId,
          toolResult: event.result,
          isError: event.isError,
        });
        await this.eventStreamManager.publish(sessionId, {
          type: 'tool_result',
          sessionId,
          messageId,
          toolCallId: event.toolCallId,
          result: event.result,
          isError: event.isError,
        } as Omit<StreamEvent, 'id' | 'timestamp'>);
        break;

      case 'done': {
        // Flush any remaining buffered deltas
        await this.flushBuffer(sessionId, messageId);
        const estimatedCost = event.usage
          ? calculateCost(model, {
              promptTokens: event.usage.promptTokens,
              completionTokens: event.usage.completionTokens,
              cacheReadTokens: event.usage.cacheReadTokens,
              cacheWriteTokens: event.usage.cacheWriteTokens,
            })
          : undefined;
        this.log.info('Message complete', {
          sessionId,
          messageId,
          estimatedCost,
        });
        await this.eventStreamManager.publish(sessionId, {
          type: 'message_complete',
          sessionId,
          messageId,
          usage: event.usage
            ? {
                ...event.usage,
                estimatedCost,
              }
            : undefined,
          finishReason: event.finishReason,
        } as Omit<StreamEvent, 'id' | 'timestamp'>);
        break;
      }

      case 'error':
        // Flush any buffered deltas before error
        await this.flushBuffer(sessionId, messageId);
        this.log.error('Stream error', {
          sessionId,
          messageId,
          code: event.error.code,
        });
        // Persist error event to DB
        await this.agentsFeature.events.insert({
          sessionId,
          messageId,
          sequence,
          type: 'error',
          errorCode: event.error.code,
          errorMessage: event.error.message,
          errorRetryable: event.error.retryable,
          errorDetails: event.error.details
            ? { ...event.error.details }
            : undefined,
        });
        await this.publishError(sessionId, messageId, event.error);
        break;

      default:
        // Flush any buffered deltas before unknown event
        await this.flushBuffer(sessionId, messageId);
        // Store unknown event types for debugging/future handling
        await this.agentsFeature.events.insert({
          sessionId,
          messageId,
          sequence,
          type: 'unknown',
          rawEventType: (event as { type: string }).type,
          rawData: event,
        });
        console.warn(
          `Unknown event type: ${(event as { type: string }).type}`,
          event
        );
        break;
    }
  }

  /**
   * Flush any buffered events to the database
   */
  private async flushBuffer(
    sessionId: string,
    messageId: string
  ): Promise<void> {
    const buffered = this.eventBuffer.flush();
    if (!buffered) return;

    await this.agentsFeature.events.insert({
      sessionId,
      messageId,
      sequence: buffered.sequence,
      type: buffered.event.type,
      content: buffered.event.content,
    });
  }

  private async publishError(
    sessionId: string,
    messageId: string,
    error: AgentError
  ): Promise<void> {
    await this.eventStreamManager.publish(sessionId, {
      type: 'error',
      sessionId,
      messageId,
      error: error.message,
      code: error.code,
      retryable: error.retryable,
      details: error.details,
    } as Omit<StreamEvent, 'id' | 'timestamp'>);
  }

  private async publishInterrupted(
    sessionId: string,
    messageId: string
  ): Promise<void> {
    await this.eventStreamManager.publish(sessionId, {
      type: 'interrupted',
      sessionId,
      messageId,
    } as Omit<StreamEvent, 'id' | 'timestamp'>);
  }
}

/**
 * Convert a raw tool result to AI SDK's ToolResultOutput format
 * AI SDK v6 requires tool outputs to be wrapped with a type discriminator
 */
function wrapToolResultOutput(
  result: unknown,
  isError?: boolean
): ToolResultOutput {
  // Check if already in correct format
  if (
    result &&
    typeof result === 'object' &&
    'type' in result &&
    'value' in result
  ) {
    const typed = result as { type: string; value: unknown };
    if (
      ['text', 'json', 'error-text', 'error-json', 'content'].includes(
        typed.type
      )
    ) {
      return result as ToolResultOutput;
    }
  }

  // Wrap based on type
  if (typeof result === 'string') {
    if (isError) {
      return { type: 'error-text', value: result };
    }
    return { type: 'text', value: result };
  }

  // For objects/arrays/other, use JSON format
  if (isError) {
    return { type: 'error-json', value: result ?? {} };
  }
  return { type: 'json', value: result ?? {} };
}

/**
 * Convert database messages to AI-compatible message format
 * Properly converts all message parts including tool calls and results
 */
export function convertToAIMessages(dbMessages: DbMessage[]): Message[] {
  return dbMessages
    .map((msg): Message | null => {
      // Build maps for tool lookups
      const toolNameMap = new Map<string, string>();
      const toolErrorMap = new Map<string, boolean>();
      for (const part of msg.parts) {
        if (part.type === 'tool_invocation') {
          toolNameMap.set(part.toolCallId, part.toolName);
        }
        if (part.type === 'tool_result') {
          toolErrorMap.set(part.toolCallId, part.isError ?? false);
        }
      }

      // Handle user messages - they only have text content
      if (msg.role === 'user') {
        const textContent = msg.parts
          .filter((p) => p.type === 'text')
          .map((p) => (p as { type: 'text'; content: string }).content)
          .join('');
        if (textContent.length === 0) return null;
        return { role: 'user', content: textContent };
      }

      // Handle system messages
      if (msg.role === 'system') {
        const textContent = msg.parts
          .filter((p) => p.type === 'text')
          .map((p) => (p as { type: 'text'; content: string }).content)
          .join('');
        if (textContent.length === 0) return null;
        return { role: 'system', content: textContent };
      }

      // Handle assistant messages - convert all parts to AI SDK format
      const content: AssistantContentPart[] = [];

      for (const part of msg.parts) {
        switch (part.type) {
          case 'text':
            content.push({ type: 'text', text: part.content });
            break;
          case 'tool_invocation':
            content.push({
              type: 'tool-call',
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              input: part.args,
            });
            break;
          case 'tool_result':
            content.push({
              type: 'tool-result',
              toolCallId: part.toolCallId,
              toolName: toolNameMap.get(part.toolCallId) ?? 'unknown',
              output: wrapToolResultOutput(part.result, part.isError),
            });
            break;
          case 'reasoning':
            // Skip reasoning - not all providers support it in history
            break;
        }
      }

      if (content.length === 0) return null;
      return { role: 'assistant', content };
    })
    .filter((msg): msg is Message => msg !== null);
}
