import type { StreamEvent } from '../types';
import type {
  SDKMessage,
  SDKAssistantMessage,
  SDKResultMessage,
  SDKUserMessage,
  SDKStreamEventMessage,
  ContentBlock,
  UserMessageContentBlock,
  ContentBlockDelta,
  ContentBlockStart,
} from './types';
import { createLogger } from '../logger';

/**
 * Maps Claude Code SDK messages to StreamEvent objects.
 * Handles both complete assistant messages and real-time stream events.
 * Includes exhaustive error logging for unhandled message types.
 */
export class SDKMessageMapper {
  private log: ReturnType<typeof createLogger>;
  private errorCodePrefix: string;
  /**
   * Tracks whether we've seen stream events for this message.
   * When true, we skip text/thinking blocks in assistant messages
   * to avoid duplicating content that was already streamed.
   */
  private hasSeenStreamEvent: boolean = false;

  constructor(loggerName: string, errorCodePrefix: string = 'CLAUDE_CODE') {
    this.log = createLogger(`${loggerName}:Mapper`);
    this.errorCodePrefix = errorCodePrefix;
  }

  /**
   * Reset streaming state. Call this when starting a new message.
   */
  resetState(): void {
    this.hasSeenStreamEvent = false;
    this.log.debug('Mapper state reset');
  }

  /**
   * Map any SDK message to server events
   */
  mapMessage(message: unknown): StreamEvent[] {
    const msg = message as SDKMessage;

    this.log.debug('Mapping SDK message', { type: msg.type });

    switch (msg.type) {
      case 'stream_event':
        return this.mapStreamEvent(msg);
      case 'assistant':
        return this.mapAssistantMessage(msg);
      case 'result':
        return this.mapResultMessage(msg);
      case 'system':
        this.log.debug('Skipping system message', {
          subtype: msg.subtype,
          sessionId: msg.session_id,
        });
        return [];
      case 'user':
        return this.mapUserMessage(msg);
      default: {
        // Exhaustive error logging for unknown message types
        const unknownMsg = msg as { type?: string };
        this.log.error('Unhandled SDK message type', {
          type: unknownMsg.type ?? 'undefined',
          keys: Object.keys(msg as object),
          message: JSON.stringify(msg).slice(0, 500),
        });
        return [];
      }
    }
  }

  /**
   * Map SDK assistant message to server events
   */
  mapAssistantMessage(message: SDKAssistantMessage): StreamEvent[] {
    const events: StreamEvent[] = [];

    if (!message.message?.content) {
      this.log.debug('Assistant message has no content');
      return events;
    }

    const contentBlocks = message.message.content;
    this.log.debug(`Processing ${contentBlocks.length} content block(s)`);

    for (const [i, block] of contentBlocks.entries()) {
      this.log.debug(
        `Processing content block ${i + 1}/${contentBlocks.length}`,
        {
          type: block.type,
        }
      );

      const mappedEvent = this.mapContentBlock(block, i, contentBlocks.length);
      if (mappedEvent) {
        events.push(mappedEvent);
      }
    }

    this.log.debug(`Mapped assistant message to ${events.length} event(s)`, {
      eventTypes: events.map((e) => e.type),
    });

    return events;
  }

  /**
   * Map a single content block to a StreamEvent
   */
  private mapContentBlock(
    block: ContentBlock,
    blockIndex: number,
    totalBlocks: number
  ): StreamEvent | null {
    switch (block.type) {
      case 'text':
        // Skip text blocks if we've been streaming via stream_events
        // (the content was already sent incrementally)
        if (this.hasSeenStreamEvent) {
          this.log.debug(
            'Skipping text block (already streamed via stream_events)',
            {
              textLength: block.text?.length ?? 0,
            }
          );
          return null;
        }
        if (block.text) {
          this.log.debug('Mapping text block to text_delta', {
            textLength: block.text.length,
            preview:
              block.text.length > 50
                ? block.text.slice(0, 50) + '...'
                : block.text,
          });
          return {
            type: 'text_delta',
            delta: block.text,
          };
        }
        this.log.debug('Skipping text block with no text content');
        return null;

      case 'thinking':
        // Skip thinking blocks if we've been streaming via stream_events
        // (the content was already sent incrementally)
        if (this.hasSeenStreamEvent) {
          this.log.debug(
            'Skipping thinking block (already streamed via stream_events)',
            {
              thinkingLength: block.thinking?.length ?? 0,
            }
          );
          return null;
        }
        if (block.thinking) {
          this.log.debug('Mapping thinking block to reasoning_delta', {
            thinkingLength: block.thinking.length,
          });
          return {
            type: 'reasoning_delta',
            delta: block.thinking,
          };
        }
        this.log.debug('Skipping thinking block with no thinking content');
        return null;

      case 'tool_use':
        if (block.id && block.name) {
          const toolArgs =
            block.input !== undefined
              ? (block.input as Record<string, unknown>)
              : undefined;
          this.log.debug('Mapping tool_use block to tool_call_start', {
            toolCallId: block.id,
            toolName: block.name,
            hasArgs: toolArgs !== undefined,
            argsKeys: toolArgs ? Object.keys(toolArgs) : [],
          });
          return {
            type: 'tool_call_start',
            toolCallId: block.id,
            toolName: block.name,
            toolArgs,
          };
        }
        this.log.error('Invalid tool_use block: missing id or name', {
          hasId: !!block.id,
          hasName: !!block.name,
          blockIndex,
          totalBlocks,
        });
        return null;

      case 'tool_result':
        if (block.tool_use_id) {
          const resultJson = JSON.stringify(block.content);
          this.log.debug('Mapping tool_result block', {
            toolCallId: block.tool_use_id,
            isError: block.is_error ?? false,
            resultLength: resultJson.length,
          });
          return {
            type: 'tool_result',
            toolCallId: block.tool_use_id,
            result: block.content,
            isError: block.is_error ?? false,
          };
        }
        this.log.error('Invalid tool_result block: missing tool_use_id', {
          blockIndex,
          totalBlocks,
          keys: Object.keys(block),
        });
        return null;

      default:
        // Exhaustive error logging for unhandled content block types
        this.log.error('Unhandled content block type in assistant message', {
          type: block.type,
          keys: Object.keys(block),
          blockIndex,
          totalBlocks,
          blockPreview: JSON.stringify(block).slice(0, 300),
        });
        return null;
    }
  }

  /**
   * Map SDK result message to server events
   */
  mapResultMessage(message: SDKResultMessage): StreamEvent[] {
    const events: StreamEvent[] = [];

    this.log.debug('Mapping result message', {
      subtype: message.subtype,
      hasUsage: !!message.usage,
      hasCost: message.total_cost_usd !== undefined,
      errors: message.errors,
    });

    if (message.subtype === 'success') {
      const usage = message.usage
        ? {
            promptTokens: message.usage.input_tokens,
            completionTokens: message.usage.output_tokens,
            estimatedCost: message.total_cost_usd,
            cacheReadTokens: message.usage.cache_read_input_tokens,
            cacheWriteTokens: message.usage.cache_creation_input_tokens,
          }
        : undefined;

      this.log.info('Mapping success result to message_complete', {
        usage,
      });

      events.push({
        type: 'message_complete',
        usage,
        finishReason: 'end_turn',
      });
    } else if (message.subtype.startsWith('error')) {
      const errorMessage = message.errors?.join('; ') ?? 'Unknown error';
      this.log.error('Mapping error result', {
        errorCode: message.subtype,
        errorMessage,
      });
      events.push({
        type: 'error',
        error: errorMessage,
        code: message.subtype,
        retryable: true,
      });
    } else {
      // Exhaustive error logging for unknown result subtypes
      this.log.error('Unknown result subtype', {
        subtype: message.subtype,
        hasUsage: !!message.usage,
        hasCost: message.total_cost_usd !== undefined,
        errors: message.errors,
        result: message.result?.slice(0, 200),
        keys: Object.keys(message),
      });
    }

    return events;
  }

  /**
   * Map SDK user message to server events
   * User messages can contain tool_result content blocks
   */
  mapUserMessage(message: SDKUserMessage): StreamEvent[] {
    const events: StreamEvent[] = [];

    const msgContent = message.message?.content;
    if (!msgContent) {
      this.log.debug('Skipping user message (no content)');
      return events;
    }

    // Content can be string or array of content blocks
    if (typeof msgContent === 'string') {
      this.log.debug('Skipping user message (text only)');
      return events;
    }

    const contentBlocks = Array.isArray(msgContent) ? msgContent : [msgContent];
    this.log.debug(
      `Processing user message with ${contentBlocks.length} content block(s)`
    );

    for (const [i, block] of contentBlocks.entries()) {
      const mappedEvent = this.mapUserContentBlock(
        block,
        i,
        contentBlocks.length
      );
      if (mappedEvent) {
        events.push(mappedEvent);
      }
    }

    if (events.length === 0) {
      this.log.debug('Skipping user message (no mapped events)');
    } else {
      this.log.debug(`Mapped user message to ${events.length} event(s)`);
    }

    return events;
  }

  /**
   * Map a single user content block to a StreamEvent
   */
  private mapUserContentBlock(
    block: UserMessageContentBlock,
    blockIndex: number,
    totalBlocks: number
  ): StreamEvent | null {
    switch (block.type) {
      case 'tool_result':
        if (block.tool_use_id) {
          const resultJson = JSON.stringify(block.content);
          this.log.debug('Mapping tool_result from user message', {
            toolCallId: block.tool_use_id,
            isError: block.is_error ?? false,
            resultLength: resultJson.length,
          });
          return {
            type: 'tool_result',
            toolCallId: block.tool_use_id,
            result: block.content,
            isError: block.is_error ?? false,
          };
        }
        this.log.error(
          'Invalid tool_result in user message: missing tool_use_id',
          {
            blockIndex,
            totalBlocks,
            keys: Object.keys(block),
          }
        );
        return null;

      case 'text':
        // Text blocks in user messages are typically the user's input
        // We skip these as they're not events we need to emit
        this.log.debug('Skipping text block in user message');
        return null;

      default:
        // Exhaustive error logging for unhandled user content types
        this.log.error('Unhandled content block type in user message', {
          type: block.type,
          keys: Object.keys(block),
          blockIndex,
          totalBlocks,
          blockPreview: JSON.stringify(block).slice(0, 300),
        });
        return null;
    }
  }

  // ============= Stream Event Handling =============
  // These methods handle real-time streaming events from the Anthropic API
  // when includePartialMessages: true is set

  /**
   * Map SDK stream event to server events.
   * These are real-time streaming events from the Anthropic API.
   */
  mapStreamEvent(message: SDKStreamEventMessage): StreamEvent[] {
    // Mark that we've seen stream events - this prevents duplicate
    // text/thinking from being emitted when the assistant message arrives
    this.hasSeenStreamEvent = true;

    const event = message.event;

    // Log all incoming stream events for debugging
    this.log.info('Received stream_event', {
      eventType: event.type,
      parentToolUseId: message.parent_tool_use_id,
      eventKeys: Object.keys(event),
      eventPreview: JSON.stringify(event).slice(0, 300),
    });

    switch (event.type) {
      case 'content_block_delta':
        return this.mapContentBlockDelta(event);

      case 'content_block_start':
        return this.mapContentBlockStart(event);

      case 'content_block_stop':
        this.log.debug('Content block stopped', { index: event.index });
        return [];

      case 'message_start':
        this.log.debug('Message started');
        return [];

      case 'message_delta':
        this.log.debug('Message delta received');
        return [];

      case 'message_stop':
        this.log.debug('Message stopped');
        return [];

      default: {
        const unknownEvent = event as { type?: string };
        this.log.warn('Unhandled stream event type', {
          type: unknownEvent.type ?? 'unknown',
          fullEvent: JSON.stringify(event).slice(0, 500),
        });
        return [];
      }
    }
  }

  /**
   * Map content_block_delta events to StreamEvents.
   * These contain the actual incremental text/thinking content.
   */
  private mapContentBlockDelta(event: ContentBlockDelta): StreamEvent[] {
    const delta = event.delta;

    this.log.debug('Processing content_block_delta', {
      index: event.index,
      deltaType: delta.type,
    });

    switch (delta.type) {
      case 'text_delta':
        this.log.info('Emitting text_delta', {
          index: event.index,
          textLength: delta.text.length,
          preview:
            delta.text.length > 100
              ? delta.text.slice(0, 100) + '...'
              : delta.text,
        });
        return [{ type: 'text_delta', delta: delta.text }];

      case 'thinking_delta':
        this.log.info('Emitting reasoning_delta', {
          index: event.index,
          thinkingLength: delta.thinking.length,
          preview:
            delta.thinking.length > 100
              ? delta.thinking.slice(0, 100) + '...'
              : delta.thinking,
        });
        return [{ type: 'reasoning_delta', delta: delta.thinking }];

      case 'input_json_delta':
        this.log.debug('Received input_json_delta (tool arg streaming)', {
          index: event.index,
          jsonLength: delta.partial_json.length,
          preview: delta.partial_json.slice(0, 100),
        });
        // Tool input streaming - not currently used but could be mapped
        // to tool_call_args_delta if needed
        return [];

      default: {
        const unknownDelta = delta as { type?: string };
        this.log.warn('Unhandled content block delta type', {
          type: unknownDelta.type ?? 'unknown',
          fullDelta: JSON.stringify(delta).slice(0, 300),
        });
        return [];
      }
    }
  }

  /**
   * Map content_block_start events to StreamEvents.
   * These indicate the start of a new content block (tool_use, text, thinking).
   */
  private mapContentBlockStart(event: ContentBlockStart): StreamEvent[] {
    const block = event.content_block;

    this.log.info('Content block started', {
      index: event.index,
      blockType: block.type,
      blockKeys: Object.keys(block),
    });

    switch (block.type) {
      case 'tool_use':
        // Don't emit here - args are empty at stream start.
        // Wait for the final assistant message which has complete args.
        this.log.debug(
          'Tool use block started (will emit from assistant message)',
          {
            index: event.index,
            toolCallId: block.id,
            toolName: block.name,
          }
        );
        return [];

      case 'text':
        this.log.debug('Text block started (content will come via deltas)', {
          index: event.index,
        });
        return [];

      case 'thinking':
        this.log.debug(
          'Thinking block started (content will come via deltas)',
          {
            index: event.index,
          }
        );
        return [];

      default: {
        const unknownBlock = block as { type?: string };
        this.log.warn('Unhandled content block start type', {
          type: unknownBlock.type ?? 'unknown',
          fullBlock: JSON.stringify(block).slice(0, 300),
        });
        return [];
      }
    }
  }
}
