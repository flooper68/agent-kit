import type { SessionSummarizer } from '../../../agent/shared/session-summarizer';
import type { GetSessionWithMessagesQuery } from '../queries/get-session-with-messages';
import type { UpdateSessionSummaryCommand } from './update-session-summary';
import type { CacheInvalidationService } from '../../../real-time';
import { logger } from '../../../agent/shared/logger';

export interface TriggerSummarizationInput {
  sessionId: string;
  messageCount: number;
  userId: string;
}

export interface TriggerSummarizationResult {
  summarized: boolean;
  title?: string;
  description?: string;
}

/**
 * TriggerSummarizationCommand - Orchestrates session summarization
 * Business logic for threshold-based session title/description generation:
 * 1. Checks if message count hits a summarization threshold
 * 2. Fetches session with messages
 * 3. Generates summary via LLM
 * 4. Updates session with new title and description
 */
export class TriggerSummarizationCommand {
  private log = logger.child({ component: 'TriggerSummarizationCommand' });

  constructor(
    private sessionSummarizer: SessionSummarizer,
    private getSessionWithMessagesQuery: GetSessionWithMessagesQuery,
    private updateSessionSummaryCommand: UpdateSessionSummaryCommand,
    private cacheInvalidation: CacheInvalidationService
  ) {}

  async execute(
    input: TriggerSummarizationInput
  ): Promise<TriggerSummarizationResult> {
    const { sessionId, messageCount } = input;

    // Check if we hit a summarization threshold
    if (!this.sessionSummarizer.shouldSummarize(messageCount)) {
      return { summarized: false };
    }

    this.log.info('Triggering summarization', {
      sessionId,
      messageCount,
    });

    // Get session with messages for summarization
    const session = await this.getSessionWithMessagesQuery.execute({
      sessionId,
    });

    if (!session) {
      this.log.warn('Session not found for summarization', { sessionId });
      return { summarized: false };
    }

    // Map to MessageWithParts format expected by summarizer
    const messages = session.messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      parts: msg.parts,
    }));

    // Generate summary
    const summary = await this.sessionSummarizer.generateSummary(messages);

    // Update session with summary
    await this.updateSessionSummaryCommand.execute({
      sessionId,
      title: summary.title,
      description: summary.description,
    });

    // Publish cache invalidation so clients update session list
    await this.cacheInvalidation.publishSessionSummaryUpdated(
      input.userId,
      sessionId
    );

    this.log.info('Summarization complete', {
      sessionId,
      title: summary.title,
    });

    return {
      summarized: true,
      title: summary.title,
      description: summary.description,
    };
  }

  /**
   * Check if summarization should be triggered for given message count
   * Exposed for callers who want to check before calling execute()
   */
  shouldTrigger(messageCount: number): boolean {
    return this.sessionSummarizer.shouldSummarize(messageCount);
  }
}
