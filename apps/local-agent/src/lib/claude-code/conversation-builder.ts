import type { SessionMessage, SessionEvent } from '../types';

/**
 * Reconstruct conversation context from session messages and raw events.
 * Groups events by message and builds a readable context string.
 */
export function reconstructConversationFromEvents(
  messages: SessionMessage[],
  events: SessionEvent[]
): string {
  // Filter to only complete messages (skip streaming/error)
  const completeMessages = messages.filter(
    (m) => m.status === 'complete' && m.role !== 'system'
  );

  if (completeMessages.length === 0) {
    return '';
  }

  // Group events by messageId
  const eventsByMessage = new Map<string, SessionEvent[]>();
  for (const event of events) {
    const messageEvents = eventsByMessage.get(event.messageId) || [];
    messageEvents.push(event);
    eventsByMessage.set(event.messageId, messageEvents);
  }

  // Build tool result lookup for quick access
  const buildToolResultMap = (
    messageEvents: SessionEvent[]
  ): Map<string, SessionEvent> => {
    const toolResults = new Map<string, SessionEvent>();
    for (const event of messageEvents) {
      if (event.type === 'tool_result' && event.toolCallId) {
        toolResults.set(event.toolCallId, event);
      }
    }
    return toolResults;
  };

  const contextParts: string[] = [];

  for (const message of completeMessages) {
    const messageEvents = eventsByMessage.get(message.id) || [];
    // Sort events by sequence
    const sortedEvents = [...messageEvents].sort(
      (a, b) => a.sequence - b.sequence
    );

    const toolResultMap = buildToolResultMap(sortedEvents);
    const messageParts: string[] = [];
    let currentText = '';

    for (const event of sortedEvents) {
      switch (event.type) {
        case 'text_delta':
          currentText += event.content ?? '';
          break;

        case 'reasoning_delta':
          // Skip reasoning content in context - it's internal thinking
          break;

        case 'tool_call': {
          // Flush accumulated text before tool call
          if (currentText) {
            messageParts.push(currentText);
            currentText = '';
          }

          const toolArgs = event.toolArgs
            ? JSON.stringify(event.toolArgs)
            : '{}';
          messageParts.push(
            `[Tool Call: ${event.toolName} with arguments ${toolArgs}]`
          );

          // Add tool result if available
          const result = event.toolCallId
            ? toolResultMap.get(event.toolCallId)
            : undefined;
          if (result) {
            const errorPrefix = result.isError ? '[ERROR] ' : '';
            messageParts.push(
              `[Tool Result: ${errorPrefix}${JSON.stringify(result.toolResult)}]`
            );
          }
          break;
        }

        case 'tool_result':
          // Tool results are handled when we process tool_call events
          break;

        case 'error':
          // Skip error events in context
          break;
      }
    }

    // Flush any remaining text
    if (currentText) {
      messageParts.push(currentText);
    }

    if (messageParts.length > 0) {
      const roleLabel = message.role === 'user' ? 'User' : 'Assistant';
      const messageContent = messageParts.join('\n');
      contextParts.push(`${roleLabel}: ${messageContent}`);
    }
  }

  return contextParts.join('\n\n');
}
