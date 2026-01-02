import type { AgentSessionEvent } from '../../db/schema/agent-session-events';
import type { MessagePart } from '../../db/schema/agent-session-messages';

/**
 * Reconstruct MessagePart[] from AgentSessionEvent[] rows
 * Used to rebuild message content from streamed events
 */
export function reconstructPartsFromEvents(
  events: AgentSessionEvent[]
): MessagePart[] {
  const parts: MessagePart[] = [];

  // Concatenate all text deltas
  const textContent = events
    .filter((e) => e.type === 'text_delta')
    .map((e) => e.content ?? '')
    .join('');

  if (textContent) {
    parts.push({ type: 'text', content: textContent });
  }

  // Concatenate all reasoning deltas
  const reasoningContent = events
    .filter((e) => e.type === 'reasoning_delta')
    .map((e) => e.content ?? '')
    .join('');

  if (reasoningContent) {
    parts.push({ type: 'reasoning', content: reasoningContent });
  }

  // Add tool invocations
  const toolCalls = events.filter((e) => e.type === 'tool_call');
  const toolResults = events.filter((e) => e.type === 'tool_result');

  for (const toolCall of toolCalls) {
    const result = toolResults.find(
      (r) => r.toolCallId === toolCall.toolCallId
    );
    const state = result ? (result.isError ? 'error' : 'completed') : 'running';

    parts.push({
      type: 'tool_invocation',
      toolCallId: toolCall.toolCallId ?? '',
      toolName: toolCall.toolName ?? '',
      args: (toolCall.toolArgs as Record<string, unknown>) ?? {},
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
  }

  return parts;
}
