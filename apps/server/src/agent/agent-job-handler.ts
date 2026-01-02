import type {
  AgentSessionManager,
  StreamEvent,
  AgentJob,
} from './agent-session-manager';
import type { MessagePart } from '../db/schema/agent-session-messages';
import { getProvider } from './providers';
import { getToolsById } from './tools';
import type { ProviderStreamEvent, Message } from './types';
import type { AgentError } from './errors';
import { classifyError } from './errors';
import { logger } from './logger';
import { SessionSummarizer } from './session-summarizer';
import { calculateCost } from '../features/agents/pricing';

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
  private sessionManager: AgentSessionManager;
  private workerId: string;
  private eventSequence = 0;
  private log: ReturnType<typeof logger.child>;
  private summarizer: SessionSummarizer;

  constructor(sessionManager: AgentSessionManager, workerId: string) {
    this.sessionManager = sessionManager;
    this.workerId = workerId;
    this.log = logger.child({ workerId });
    this.summarizer = new SessionSummarizer();
  }

  /**
   * Process a single agent job
   */
  async handle(job: AgentJob): Promise<void> {
    const { sessionId, agentId, content } = job;

    // Create user message first (preserves user input even if job fails)
    const userMessage = await this.sessionManager.createMessage({
      sessionId,
      role: 'user',
      status: 'complete',
    });

    // Insert user message content event
    await this.sessionManager.insertEvent({
      sessionId,
      messageId: userMessage.id,
      sequence: 0,
      type: 'text_delta',
      content,
    });

    // Publish user_message_created event so client can update optimistic message
    await this.sessionManager.publishEvent(sessionId, {
      type: 'user_message_created',
      sessionId,
      messageId: userMessage.id,
      content,
    } as Omit<StreamEvent, 'id' | 'timestamp'>);

    // Create assistant placeholder
    const assistantMessage = await this.sessionManager.createMessage({
      sessionId,
      role: 'assistant',
      status: 'pending',
    });

    // Update session timestamp
    await this.sessionManager.updateSessionTimestamp(sessionId);

    const messageId = assistantMessage.id;

    // Get agent definition
    const agent = this.sessionManager.agents.get(agentId);
    if (!agent) {
      this.log.error('Agent not found', { sessionId });
      await this.sessionManager.updateMessageStatus(messageId, 'error');
      await this.publishError(sessionId, messageId, {
        code: 'SESSION_ERROR',
        message: `Agent not found: ${agentId}`,
        retryable: false,
      });
      return;
    }

    this.log.info('Starting job', {
      sessionId,
      model: agent.model,
      provider: agent.provider,
    });

    // Get provider
    const provider = getProvider(agent.provider);
    if (!provider) {
      this.log.error('Provider not found', {
        sessionId,
        provider: agent.provider,
      });
      await this.sessionManager.updateMessageStatus(messageId, 'error');
      await this.publishError(sessionId, messageId, {
        code: 'PROVIDER_ERROR',
        message: `Provider not found: ${agent.provider}`,
        retryable: false,
      });
      return;
    }

    // Register job for interruption tracking
    await this.sessionManager.registerJob(sessionId, this.workerId);

    try {
      // Update message status to streaming
      await this.sessionManager.updateMessageStatus(messageId, 'streaming');

      // Get conversation history
      const dbMessages =
        await this.sessionManager.getSessionMessages(sessionId);
      const messages = convertToAIMessages(dbMessages);

      // Get tools for this agent
      const tools = getToolsById(agent.tools);

      // Publish message start event
      await this.sessionManager.publishEvent(sessionId, {
        type: 'message_start',
        sessionId,
        messageId,
      } as Omit<StreamEvent, 'id' | 'timestamp'>);

      // Create abort controller for interruption
      const abortController = new AbortController();

      // Stream the response
      const stream = provider.createStream({
        model: agent.model,
        systemPrompt: agent.systemPrompt,
        messages,
        tools,
        abortSignal: abortController.signal,
      });

      // Track start time for latency calculation
      const startTime = Date.now();

      let finalStatus: 'complete' | 'error' | 'interrupted' = 'complete';
      let finalMetadata:
        | { tokensUsed?: number; finishReason?: string }
        | undefined;

      for await (const event of stream) {
        // Check for interrupt
        if (await this.sessionManager.isInterrupted(sessionId)) {
          this.log.info('Interrupted by user', { sessionId, messageId });
          abortController.abort();
          finalStatus = 'interrupted';
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

        // Capture final metadata from done event and update session usage
        if (event.type === 'done') {
          finalMetadata = {
            tokensUsed: event.usage
              ? event.usage.promptTokens + event.usage.completionTokens
              : undefined,
            finishReason: event.finishReason,
          };

          // Update session usage metrics
          if (event.usage) {
            const latency = Date.now() - startTime;
            await this.sessionManager.updateSessionUsage({
              sessionId,
              promptTokens: event.usage.promptTokens,
              completionTokens: event.usage.completionTokens,
              latency,
              model: agent.model,
              provider: agent.provider,
            });
          }
        }

        if (event.type === 'error') {
          finalStatus = 'error';
        }
      }

      // Update message status to complete
      await this.sessionManager.updateMessageStatus(
        messageId,
        finalStatus,
        finalMetadata
      );

      // Trigger summarization for successful completions
      if (finalStatus === 'complete') {
        this.triggerSummarizationIfNeeded(sessionId).catch((err) => {
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
      await this.sessionManager.updateMessageStatus(messageId, 'error');
      await this.publishError(sessionId, messageId, agentError);
    } finally {
      await this.sessionManager.unregisterJob(sessionId);
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
      case 'text_delta':
        await this.sessionManager.insertEvent({
          sessionId,
          messageId,
          sequence,
          type: 'text_delta',
          content: event.content,
        });
        await this.sessionManager.publishEvent(sessionId, {
          type: 'text_delta',
          sessionId,
          messageId,
          delta: event.content,
        } as Omit<StreamEvent, 'id' | 'timestamp'>);
        break;

      case 'reasoning_delta':
        await this.sessionManager.insertEvent({
          sessionId,
          messageId,
          sequence,
          type: 'reasoning_delta',
          content: event.content,
        });
        await this.sessionManager.publishEvent(sessionId, {
          type: 'reasoning_delta',
          sessionId,
          messageId,
          delta: event.content,
        } as Omit<StreamEvent, 'id' | 'timestamp'>);
        break;

      case 'tool_call':
        this.log.debug('Tool call', {
          sessionId,
          toolName: event.toolName,
          toolCallId: event.toolCallId,
        });
        await this.sessionManager.insertEvent({
          sessionId,
          messageId,
          sequence,
          type: 'tool_call',
          toolCallId: event.toolCallId,
          toolName: event.toolName,
          toolArgs: event.args,
        });
        await this.sessionManager.publishEvent(sessionId, {
          type: 'tool_call_start',
          sessionId,
          messageId,
          toolCallId: event.toolCallId,
          toolName: event.toolName,
        } as Omit<StreamEvent, 'id' | 'timestamp'>);
        break;

      case 'tool_result':
        this.log.debug('Tool result', {
          sessionId,
          toolCallId: event.toolCallId,
        });
        await this.sessionManager.insertEvent({
          sessionId,
          messageId,
          sequence,
          type: 'tool_result',
          toolCallId: event.toolCallId,
          toolResult: event.result,
          isError: event.isError,
        });
        await this.sessionManager.publishEvent(sessionId, {
          type: 'tool_result',
          sessionId,
          messageId,
          toolCallId: event.toolCallId,
          result: event.result,
          isError: event.isError,
        } as Omit<StreamEvent, 'id' | 'timestamp'>);
        break;

      case 'done': {
        const estimatedCost = event.usage
          ? calculateCost(
              model,
              event.usage.promptTokens,
              event.usage.completionTokens
            )
          : undefined;
        this.log.info('Message complete', {
          sessionId,
          messageId,
          estimatedCost,
        });
        await this.sessionManager.publishEvent(sessionId, {
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
        this.log.error('Stream error', {
          sessionId,
          messageId,
          code: event.error.code,
        });
        // Persist error event to DB
        await this.sessionManager.insertEvent({
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
        // Store unknown event types for debugging/future handling
        await this.sessionManager.insertEvent({
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

  private async publishError(
    sessionId: string,
    messageId: string,
    error: AgentError
  ): Promise<void> {
    await this.sessionManager.publishEvent(sessionId, {
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
    await this.sessionManager.publishEvent(sessionId, {
      type: 'interrupted',
      sessionId,
      messageId,
    } as Omit<StreamEvent, 'id' | 'timestamp'>);
  }

  /**
   * Check if summarization should be triggered and run it async
   */
  private async triggerSummarizationIfNeeded(sessionId: string): Promise<void> {
    // Increment message count and get new value
    const newCount = await this.sessionManager.incrementMessageCount(sessionId);

    if (!newCount) {
      this.log.warn('Failed to increment message count', { sessionId });
      return;
    }

    // Check if we hit a threshold
    if (!this.summarizer.shouldSummarize(newCount)) {
      return;
    }

    this.log.info('Triggering summarization', {
      sessionId,
      messageCount: newCount,
    });

    // Get all messages for summarization
    const messages = await this.sessionManager.getSessionMessages(sessionId);

    // Generate summary
    const summary = await this.summarizer.generateSummary(messages);

    // Update session with summary
    await this.sessionManager.updateSessionSummary(
      sessionId,
      summary.title,
      summary.description
    );

    this.log.info('Summarization complete', {
      sessionId,
      title: summary.title,
    });
  }
}

/**
 * Convert database messages to AI-compatible message format
 * Filters out messages with empty content (e.g., assistant messages with only tool parts)
 */
export function convertToAIMessages(dbMessages: DbMessage[]): Message[] {
  return dbMessages
    .map((msg) => {
      const textContent = msg.parts
        .filter((p) => p.type === 'text')
        .map((p) => (p as { type: 'text'; content: string }).content)
        .join('');

      return {
        role: msg.role,
        content: textContent,
      };
    })
    .filter((msg) => msg.content.length > 0);
}
