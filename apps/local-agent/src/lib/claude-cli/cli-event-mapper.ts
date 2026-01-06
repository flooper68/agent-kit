import type { StreamEvent } from '../types';
import type {
  CliEvent,
  CliAssistantEvent,
  CliResultEvent,
  CliSystemEvent,
  CliUserEvent,
  CliContentBlock,
  CliToolResultBlock,
  InternalSessionIdEvent,
  CliStreamEvent,
} from './types';
import { createLogger } from '../logger';

/**
 * Union type for events that can be returned from the mapper.
 * Includes internal events that shouldn't be yielded externally.
 */
export type MappedEvent = StreamEvent | InternalSessionIdEvent;

/**
 * Maps CLI NDJSON events to StreamEvent types.
 *
 * The CLI outputs newline-delimited JSON events that need to be
 * converted to the server's StreamEvent format for consistency.
 */
export class CliEventMapper {
  private log: ReturnType<typeof createLogger>;
  private errorCodePrefix: string;
  private seenToolUseIds = new Set<string>();

  constructor(loggerName: string, errorCodePrefix: string = 'CLAUDE_CLI') {
    this.log = createLogger(`${loggerName}:CliMapper`);
    this.errorCodePrefix = errorCodePrefix;
  }

  /**
   * Parse a single NDJSON line and map to StreamEvent(s).
   *
   * @param line - Raw NDJSON line from CLI stdout
   * @returns Array of mapped events (may be empty if line is malformed)
   */
  mapLine(line: string): MappedEvent[] {
    const trimmed = line.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const event = JSON.parse(trimmed) as CliEvent;
      return this.mapEvent(event);
    } catch (error) {
      this.log.error('Failed to parse NDJSON line', {
        line: trimmed.slice(0, 200),
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Map a parsed CLI event to StreamEvent(s).
   */
  private mapEvent(event: CliEvent): MappedEvent[] {
    switch (event.type) {
      case 'system':
        return this.mapSystemEvent(event as CliSystemEvent);
      case 'assistant':
        return this.mapAssistantEvent(event as CliAssistantEvent);
      case 'user':
        return this.mapUserEvent(event as CliUserEvent);
      case 'result':
        return this.mapResultEvent(event as CliResultEvent);
      case 'stream_event':
        return this.mapStreamEvent(event as CliStreamEvent);
      default:
        this.log.warn('Unknown CLI event type', {
          type: (event as { type: string }).type,
        });
        return [];
    }
  }

  /**
   * Map system events (init, etc.).
   */
  private mapSystemEvent(event: CliSystemEvent): MappedEvent[] {
    if (event.subtype === 'init' && event.session_id) {
      this.log.debug('Captured session ID from init event', {
        sessionId: event.session_id.slice(0, 8) + '...',
      });
      // Return internal event to capture session ID
      return [{ type: '_internal_session_id', cliSessionId: event.session_id }];
    }
    return [];
  }

  /**
   * Map assistant events (text, thinking, tool_use).
   */
  private mapAssistantEvent(event: CliAssistantEvent): MappedEvent[] {
    const events: MappedEvent[] = [];
    const content = event.message?.content;

    if (!content || !Array.isArray(content)) {
      return events;
    }

    for (const block of content) {
      const mapped = this.mapContentBlock(block);
      if (mapped) {
        events.push(mapped);
      }
    }

    return events;
  }

  /**
   * Map a single content block to a StreamEvent.
   */
  private mapContentBlock(block: CliContentBlock): StreamEvent | null {
    switch (block.type) {
      case 'text':
        if (block.text) {
          return { type: 'text_delta', delta: block.text };
        }
        break;

      case 'thinking':
        if (block.thinking) {
          return { type: 'reasoning_delta', delta: block.thinking };
        }
        break;

      case 'tool_use':
        if (block.id && block.name && !this.seenToolUseIds.has(block.id)) {
          this.seenToolUseIds.add(block.id);
          return {
            type: 'tool_call_start',
            toolCallId: block.id,
            toolName: block.name,
            toolArgs: block.input as Record<string, unknown> | undefined,
          };
        }
        break;
    }

    return null;
  }

  /**
   * Map user events (tool results).
   */
  private mapUserEvent(event: CliUserEvent): MappedEvent[] {
    const events: MappedEvent[] = [];
    const content = event.message?.content;

    if (!content || !Array.isArray(content)) {
      return events;
    }

    for (const block of content) {
      const mapped = this.mapToolResultBlock(block);
      if (mapped) {
        events.push(mapped);
      }
    }

    return events;
  }

  /**
   * Map a tool result block to a StreamEvent.
   */
  private mapToolResultBlock(block: CliToolResultBlock): StreamEvent | null {
    if (block.type === 'tool_result' && block.tool_use_id) {
      return {
        type: 'tool_result',
        toolCallId: block.tool_use_id,
        result: block.content,
        isError: block.is_error ?? false,
      };
    }
    return null;
  }

  /**
   * Map result events (success, error).
   */
  private mapResultEvent(event: CliResultEvent): MappedEvent[] {
    if (event.subtype === 'success') {
      return [
        {
          type: 'message_complete',
          usage: {
            promptTokens: event.usage?.input_tokens ?? 0,
            completionTokens: event.usage?.output_tokens ?? 0,
            estimatedCost: event.cost_usd,
          },
          finishReason: 'end_turn',
        },
      ];
    }

    // Handle error subtypes
    if (event.is_error || event.subtype?.startsWith('error')) {
      const errorMessage =
        event.errors?.join('; ') ?? `CLI ${event.subtype ?? 'error'}`;
      return [
        {
          type: 'error',
          error: errorMessage,
          code: `${this.errorCodePrefix}_${(event.subtype ?? 'ERROR').toUpperCase().replace(/-/g, '_')}`,
          retryable: event.subtype === 'error_max_turns',
        },
      ];
    }

    return [];
  }

  /**
   * Map stream events from --include-partial-messages.
   * These provide real-time token-level updates.
   */
  private mapStreamEvent(event: CliStreamEvent): MappedEvent[] {
    const innerEvent = event.event;

    switch (innerEvent.type) {
      case 'content_block_delta':
        return this.mapStreamDelta(innerEvent.delta);

      case 'content_block_start':
        // Handle tool_use start
        if (innerEvent.content_block?.type === 'tool_use') {
          const block = innerEvent.content_block;
          if (block.id && block.name && !this.seenToolUseIds.has(block.id)) {
            this.seenToolUseIds.add(block.id);
            return [
              {
                type: 'tool_call_start',
                toolCallId: block.id,
                toolName: block.name,
                toolArgs: block.input as Record<string, unknown> | undefined,
              },
            ];
          }
        }
        return [];

      case 'message_start':
      case 'content_block_stop':
      case 'message_delta':
      case 'message_stop':
        // These are lifecycle events, no content to map
        return [];

      default:
        return [];
    }
  }

  /**
   * Map a stream delta to a StreamEvent.
   */
  private mapStreamDelta(
    delta: CliStreamEvent['event']['delta']
  ): MappedEvent[] {
    if (!delta) return [];

    switch (delta.type) {
      case 'text_delta':
        if (delta.text) {
          return [{ type: 'text_delta', delta: delta.text }];
        }
        break;

      case 'thinking_delta':
        if (delta.thinking) {
          return [{ type: 'reasoning_delta', delta: delta.thinking }];
        }
        break;

      case 'input_json_delta':
        // Tool input streaming - could map to tool_call_args_delta if needed
        break;
    }

    return [];
  }

  /**
   * Reset state between runs.
   * Call this when starting a new agent run.
   */
  reset(): void {
    this.seenToolUseIds.clear();
  }
}
