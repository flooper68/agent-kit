import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { MessageWithParts } from '../features/agents/types';
import { logger } from './logger';

// Message count thresholds that trigger summarization
export const SUMMARIZATION_THRESHOLDS = [1, 5, 50, 100] as const;

export interface SessionSummary {
  title: string;
  description: string;
}

export interface SummarizerConfig {
  model?: string;
  maxMessagesToInclude?: number;
}

const DEFAULT_CONFIG: Required<SummarizerConfig> = {
  model: 'gpt-4o-mini',
  maxMessagesToInclude: 20,
};

/**
 * SessionSummarizer - generates title and description for agent sessions
 * Uses a mini LLM to create concise summaries of conversations
 */
export class SessionSummarizer {
  private config: Required<SummarizerConfig>;
  private log = logger.child({ component: 'SessionSummarizer' });

  constructor(config: SummarizerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if summarization should be triggered for given message count
   */
  shouldSummarize(messageCount: number): boolean {
    return SUMMARIZATION_THRESHOLDS.includes(
      messageCount as (typeof SUMMARIZATION_THRESHOLDS)[number]
    );
  }

  /**
   * Generate title and description for a session based on messages
   */
  async generateSummary(messages: MessageWithParts[]): Promise<SessionSummary> {
    const timer = this.log.startTimer();

    // Take most recent messages up to limit
    const recentMessages = messages.slice(-this.config.maxMessagesToInclude);

    // Format messages for the prompt
    const conversationText = this.formatMessagesForPrompt(recentMessages);

    this.log.debug('Generating summary', {
      messageCount: messages.length,
    });

    try {
      const { text } = await generateText({
        model: openai(this.config.model),
        prompt: this.buildSummarizationPrompt(conversationText),
      });

      const summary = this.parseResponse(text);

      this.log.info('Summary generated', {
        duration: timer(),
      });

      return summary;
    } catch (error) {
      this.log.error('Summary generation failed', {
        duration: timer(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return fallback summary
      return this.getFallbackSummary(messages);
    }
  }

  private formatMessagesForPrompt(messages: MessageWithParts[]): string {
    return messages
      .map((msg) => {
        const textContent = msg.parts
          .filter((p) => p.type === 'text')
          .map((p) => (p as { type: 'text'; content: string }).content)
          .join('');
        return `${msg.role.toUpperCase()}: ${textContent}`;
      })
      .join('\n\n');
  }

  private buildSummarizationPrompt(conversationText: string): string {
    return `You are a conversation summarizer. Given the following conversation between a user and an AI assistant, generate a title and description.

CONVERSATION:
${conversationText}

INSTRUCTIONS:
1. Title: Create a concise title (max 10 words) that captures the main topic or intent of the conversation.
2. Description: Write a brief description (1-2 sentences) summarizing what was discussed or accomplished.

Respond in this exact format:
TITLE: [your title here]
DESCRIPTION: [your description here]

Focus on the user's main goal or question. Be specific and avoid generic phrases like "General conversation" or "AI assistance".`;
  }

  private parseResponse(text: string): SessionSummary {
    const titleMatch = text.match(/TITLE:\s*(.+?)(?:\n|$)/i);
    const descriptionMatch = text.match(/DESCRIPTION:\s*(.+?)(?:\n|$)/is);

    const title = titleMatch?.[1]?.trim() || 'Untitled Conversation';
    const description = descriptionMatch?.[1]?.trim() || '';

    // Enforce title length limit (DB constraint is 255 chars)
    const truncatedTitle =
      title.length > 250 ? title.slice(0, 247) + '...' : title;

    return {
      title: truncatedTitle,
      description,
    };
  }

  private getFallbackSummary(messages: MessageWithParts[]): SessionSummary {
    // Use first user message as fallback title
    const firstUserMessage = messages.find((m) => m.role === 'user');
    const textPart = firstUserMessage?.parts.find((p) => p.type === 'text');
    const content =
      (textPart as { type: 'text'; content: string } | undefined)?.content ||
      '';

    // Truncate to first ~50 chars for title
    const title =
      content.length > 50
        ? content.slice(0, 47) + '...'
        : content || 'New Conversation';

    return {
      title,
      description: '',
    };
  }
}
