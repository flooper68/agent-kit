import { memo } from 'react';
import type {
  TaskMessage,
  TextPart,
  ReasoningPart,
  ToolInvocationPart,
} from '../../../types/chat';
import { MessagePartItem } from './MessagePartItem';

interface MessageContentProps {
  message: TaskMessage;
}

/**
 * Custom comparison function for MessageContent
 * Compares message ID and parts to determine if re-render is needed
 */
function areMessagesContentEqual(
  prev: MessageContentProps,
  next: MessageContentProps
): boolean {
  // Different message ID means different content
  if (prev.message.id !== next.message.id) return false;
  // Different number of parts means content changed
  if (prev.message.parts.length !== next.message.parts.length) return false;

  // Check each part for changes
  for (let i = 0; i < prev.message.parts.length; i++) {
    const prevPart = prev.message.parts[i];
    const nextPart = next.message.parts[i];

    if (!prevPart || !nextPart) return false;
    if (prevPart.id !== nextPart.id) return false;
    if (prevPart.type !== nextPart.type) return false;

    // Type-specific content comparisons
    switch (prevPart.type) {
      case 'text':
        if ((prevPart as TextPart).content !== (nextPart as TextPart).content) {
          return false;
        }
        break;
      case 'reasoning': {
        const prevReasoning = prevPart as ReasoningPart;
        const nextReasoning = nextPart as ReasoningPart;
        if (
          prevReasoning.content !== nextReasoning.content ||
          prevReasoning.isCollapsed !== nextReasoning.isCollapsed
        ) {
          return false;
        }
        break;
      }
      case 'tool_invocation':
        if (
          (prevPart as ToolInvocationPart).state !==
          (nextPart as ToolInvocationPart).state
        ) {
          return false;
        }
        break;
    }
  }

  return true;
}

/**
 * Memoized component for rendering message content (all parts)
 * Uses custom comparison to prevent unnecessary re-renders
 */
export const MessageContent = memo(function MessageContent({
  message,
}: MessageContentProps) {
  return (
    <div className="space-y-2 w-full">
      {message.parts.map((part) => (
        <MessagePartItem key={part.id} part={part} message={message} />
      ))}
    </div>
  );
}, areMessagesContentEqual);

MessageContent.displayName = 'MessageContent';
