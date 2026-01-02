import type {
  AgentSessionManager,
  StreamEvent,
  AgentJob,
} from './agent-session-manager';
import type { MessagePart } from '../db/schema/agent-session-messages';
import { getProvider } from './providers';
import { getToolsById } from './tools';
import type { ProviderStreamEvent, Message } from './types';

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

  constructor(sessionManager: AgentSessionManager, workerId: string) {
    this.sessionManager = sessionManager;
    this.workerId = workerId;
  }

  private log(message: string, data?: Record<string, unknown>): void {
    const prefix = `[Agent ${this.workerId}]`;
    if (data) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  }

  /**
   * Process a single agent job
   */
  async handle(job: AgentJob): Promise<void> {
    const { sessionId, messageId, agentId } = job;

    // Get agent definition
    const agent = this.sessionManager.agents.get(agentId);
    if (!agent) {
      this.log(`Agent not found: ${agentId}`);
      await this.publishError(
        sessionId,
        messageId,
        `Agent not found: ${agentId}`
      );
      return;
    }

    this.log(`Starting job`, {
      sessionId: sessionId.slice(0, 8) + '...',
      agent: agent.name,
      model: agent.model,
    });

    // Get provider
    const provider = getProvider(agent.provider);
    if (!provider) {
      this.log(`Provider not found: ${agent.provider}`);
      await this.publishError(
        sessionId,
        messageId,
        `Provider not found: ${agent.provider}`
      );
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

      let finalStatus: 'complete' | 'error' | 'interrupted' = 'complete';
      let finalMetadata:
        | { tokensUsed?: number; finishReason?: string }
        | undefined;

      for await (const event of stream) {
        // Check for interrupt
        if (await this.sessionManager.isInterrupted(sessionId)) {
          this.log(`Interrupted by user`);
          abortController.abort();
          finalStatus = 'interrupted';
          await this.publishInterrupted(sessionId, messageId);
          break;
        }

        // Write event to database and publish to Redis
        const sequence = this.eventSequence++;
        await this.handleProviderEvent(event, sessionId, messageId, sequence);

        // Capture final metadata from done event
        if (event.type === 'done') {
          finalMetadata = {
            tokensUsed: event.usage
              ? event.usage.promptTokens + event.usage.completionTokens
              : undefined,
            finishReason: event.finishReason,
          };
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.log(`Job failed: ${errorMessage}`);
      console.error(`Error processing job for session ${sessionId}:`, error);
      await this.sessionManager.updateMessageStatus(messageId, 'error');
      await this.publishError(sessionId, messageId, errorMessage);
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
    sequence: number
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
        this.log(`Tool call: ${event.toolName}`, {
          toolCallId: event.toolCallId.slice(0, 8) + '...',
          args: event.args,
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
        this.log(`Tool result: ${event.isError ? 'ERROR' : 'success'}`, {
          toolCallId: event.toolCallId.slice(0, 8) + '...',
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

      case 'done':
        this.log(`Message complete`, {
          finishReason: event.finishReason,
          tokens: event.usage
            ? `${event.usage.promptTokens} in / ${event.usage.completionTokens} out`
            : 'N/A',
        });
        await this.sessionManager.publishEvent(sessionId, {
          type: 'message_complete',
          sessionId,
          messageId,
          usage: event.usage,
          finishReason: event.finishReason,
        } as Omit<StreamEvent, 'id' | 'timestamp'>);
        break;

      case 'error':
        this.log(`Error: ${event.error.message}`);
        await this.publishError(sessionId, messageId, event.error.message);
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
    error: string
  ): Promise<void> {
    await this.sessionManager.publishEvent(sessionId, {
      type: 'error',
      sessionId,
      messageId,
      error,
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
}

/**
 * Convert database messages to AI-compatible message format
 */
export function convertToAIMessages(dbMessages: DbMessage[]): Message[] {
  return dbMessages.map((msg) => {
    const textContent = msg.parts
      .filter((p) => p.type === 'text')
      .map((p) => (p as { type: 'text'; content: string }).content)
      .join('');

    return {
      role: msg.role,
      content: textContent,
    };
  });
}
