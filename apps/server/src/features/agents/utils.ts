import type { AgentSessionEvent } from '../../db/schema/agent-session-events';
import type { MessagePart } from '../../db/schema/agent-session-messages';

/**
 * Reconstruct MessagePart[] from AgentSessionEvent[] rows
 * Used to rebuild message content from streamed events
 * Preserves the original streaming order while coalescing consecutive same-type content
 */
export function reconstructPartsFromEvents(
  events: AgentSessionEvent[]
): MessagePart[] {
  const parts: MessagePart[] = [];

  // Sort events by sequence to ensure correct order
  const sortedEvents = [...events].sort((a, b) => a.sequence - b.sequence);

  // Build a map of tool results for quick lookup
  const toolResultMap = new Map<string, AgentSessionEvent>();
  for (const event of sortedEvents) {
    if (event.type === 'tool_result' && event.toolCallId) {
      toolResultMap.set(event.toolCallId, event);
    }
  }

  // Track current text/reasoning blocks being built
  let currentTextContent = '';
  let currentReasoningContent = '';
  let lastContentType: 'text' | 'reasoning' | null = null;

  // Track reasoning timestamps for duration calculation
  let reasoningStartTime: Date | null = null;
  let reasoningEndTime: Date | null = null;

  // Helper to flush accumulated text content
  const flushText = () => {
    if (currentTextContent) {
      parts.push({ type: 'text', content: currentTextContent });
      currentTextContent = '';
    }
  };

  // Helper to flush accumulated reasoning content
  const flushReasoning = () => {
    if (currentReasoningContent) {
      // Calculate duration in seconds
      let durationSeconds: number | undefined;
      if (reasoningStartTime && reasoningEndTime) {
        durationSeconds = Math.round(
          (reasoningEndTime.getTime() - reasoningStartTime.getTime()) / 1000
        );
      }

      // Keep reasoning blocks expanded in historical messages
      parts.push({
        type: 'reasoning',
        content: currentReasoningContent,
        isCollapsed: false,
        durationSeconds,
      });
      currentReasoningContent = '';
      reasoningStartTime = null;
      reasoningEndTime = null;
    }
  };

  // Helper to flush all accumulated content
  const flushAll = () => {
    // Flush based on what was being accumulated last
    if (lastContentType === 'text') {
      flushText();
      flushReasoning();
    } else {
      flushReasoning();
      flushText();
    }
    lastContentType = null;
  };

  for (const event of sortedEvents) {
    switch (event.type) {
      case 'text_delta':
        // If we were building reasoning, flush it first
        if (lastContentType === 'reasoning') {
          flushReasoning();
        }
        currentTextContent += event.content ?? '';
        lastContentType = 'text';
        break;

      case 'reasoning_delta':
        // If we were building text, flush it first
        if (lastContentType === 'text') {
          flushText();
        }
        // Track timestamps for duration calculation
        if (!reasoningStartTime) {
          reasoningStartTime = event.createdAt;
        }
        reasoningEndTime = event.createdAt;
        currentReasoningContent += event.content ?? '';
        lastContentType = 'reasoning';
        break;

      case 'tool_call': {
        // Flush any pending content before tool calls
        flushAll();

        const result = event.toolCallId
          ? toolResultMap.get(event.toolCallId)
          : undefined;
        const state = result
          ? result.isError
            ? 'error'
            : 'completed'
          : 'running';

        parts.push({
          type: 'tool_invocation',
          toolCallId: event.toolCallId ?? '',
          toolName: event.toolName ?? '',
          args: (event.toolArgs as Record<string, unknown>) ?? {},
          state,
        });

        // Add the result if available
        if (result) {
          parts.push({
            type: 'tool_result',
            toolCallId: result.toolCallId ?? '',
            result: result.toolResult,
            isError: result.isError ?? false,
          });
        }
        break;
      }

      case 'tool_result':
        // Tool results are handled when we process tool_call events
        break;
    }
  }

  // Flush any remaining content
  flushAll();

  return parts;
}
