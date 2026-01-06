import type { UpdateMessageStatusCommand } from './update-message-status';
import type { UpdateSessionUsageCommand } from './update-session-usage';
import type { IncrementMessageCountCommand } from './increment-message-count';
import type {
  AgentSessionMessageStatus,
  AgentSessionMessageMetadata,
} from '../types';
import type { TokenBreakdown } from '../../../db/schema/agent-sessions';

export interface CompleteMessageInput {
  messageId: string;
  sessionId: string;
  status: AgentSessionMessageStatus;
  metadata?: AgentSessionMessageMetadata;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
    contextWindowUsage?: number;
    tokenBreakdown?: TokenBreakdown;
  };
  latency?: number;
  model?: string;
  provider?: string;
}

export interface CompleteMessageResult {
  messageCount?: number;
}

/**
 * CompleteMessageCommand - Orchestrates message completion with usage tracking
 * Business logic for completing an assistant message:
 * 1. Updates the message status (complete, error, or interrupted)
 * 2. Updates session usage metrics if usage data is provided
 * 3. Increments message count for summarization threshold checking
 */
export class CompleteMessageCommand {
  constructor(
    private updateMessageStatusCommand: UpdateMessageStatusCommand,
    private updateSessionUsageCommand: UpdateSessionUsageCommand,
    private incrementMessageCountCommand: IncrementMessageCountCommand
  ) {}

  async execute(input: CompleteMessageInput): Promise<CompleteMessageResult> {
    const {
      messageId,
      sessionId,
      status,
      metadata,
      usage,
      latency,
      model,
      provider,
    } = input;

    // Update message status
    await this.updateMessageStatusCommand.execute({
      messageId,
      status,
      metadata,
    });

    // Update session usage if provided
    if (usage) {
      await this.updateSessionUsageCommand.execute({
        sessionId,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        cacheReadTokens: usage.cacheReadTokens,
        cacheWriteTokens: usage.cacheWriteTokens,
        contextWindowUsage: usage.contextWindowUsage,
        tokenBreakdown: usage.tokenBreakdown,
        latency,
        model,
        provider,
      });
    }

    // Increment message count and return for summarization threshold check
    // Only increment for successful completions
    if (status === 'complete') {
      const result = await this.incrementMessageCountCommand.execute(sessionId);
      return { messageCount: result?.messageCount };
    }

    return {};
  }
}
