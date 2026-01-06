import { memo } from 'react';
import type {
  TaskMessage,
  TextPart,
  ReasoningPart,
  ToolInvocationPart,
} from '../../../types/chat';
import { Message } from '../Core/Message';
import { CopyButton, RegenerateButton } from '../Controls';
import { MessageContent } from './MessageContent';

interface MessageItemProps {
  message: TaskMessage;
  isLastMessage: boolean;
  isSubmitting: boolean;
  avatar: { src?: string; fallback: string; name?: string };
  enableRegenerate: boolean;
  onRegenerate?: (messageId: string) => void;
}

/**
 * Get text content from a message for copying
 */
function getTextContent(message: TaskMessage): string {
  return message.parts
    .filter((p): p is TextPart => p.type === 'text')
    .map((p) => p.content)
    .join('\n');
}

/**
 * Format timestamp for display
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format full timestamp for tooltip
 */
function formatFullTimestamp(date: Date): string {
  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Custom comparison function for MessageItem
 * Compares message content and relevant props to determine if re-render is needed
 */
function areMessageItemsEqual(
  prev: MessageItemProps,
  next: MessageItemProps
): boolean {
  // Fast path: same message reference
  if (prev.message === next.message) {
    return (
      prev.isLastMessage === next.isLastMessage &&
      prev.isSubmitting === next.isSubmitting &&
      prev.enableRegenerate === next.enableRegenerate &&
      prev.onRegenerate === next.onRegenerate
    );
  }

  // For user messages, ID can change (optimistic→real) but content stays same
  // Skip ID checks for user messages and rely on content comparison
  const isUserMessage =
    prev.message.role === 'user' && next.message.role === 'user';

  // Different message ID means different message (except for user messages)
  if (prev.message.id !== next.message.id && !isUserMessage) {
    return false;
  }
  // Different number of parts means content changed
  if (prev.message.parts.length !== next.message.parts.length) return false;

  // Check each part for changes
  for (let i = 0; i < prev.message.parts.length; i++) {
    const prevPart = prev.message.parts[i];
    const nextPart = next.message.parts[i];

    if (!prevPart || !nextPart) return false;
    // Skip part ID check for user messages (can change optimistic→real)
    // Also skip for reasoning parts (ID can change during streaming)
    const isReasoningPart =
      prevPart.type === 'reasoning' && nextPart.type === 'reasoning';
    if (prevPart.id !== nextPart.id && !isUserMessage && !isReasoningPart) {
      return false;
    }
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

  // Compare other relevant props
  return (
    prev.isLastMessage === next.isLastMessage &&
    prev.isSubmitting === next.isSubmitting &&
    prev.enableRegenerate === next.enableRegenerate &&
    prev.onRegenerate === next.onRegenerate
  );
}

/**
 * Memoized component for rendering a complete message
 * Uses custom comparison to prevent unnecessary re-renders
 */
export const MessageItem = memo(function MessageItem({
  message,
  isLastMessage,
  isSubmitting,
  avatar,
  enableRegenerate,
  onRegenerate,
}: MessageItemProps) {
  const isUser = message.role === 'user';
  // Hide actions for the last assistant message while streaming
  const hideActions = !isUser && isLastMessage && isSubmitting;

  const tooltipName = isUser
    ? (avatar.name ?? 'You')
    : (avatar.name ?? 'Assistant');

  return (
    <Message role={message.role}>
      {isUser && (
        <Message.Avatar
          src={avatar.src}
          fallback={avatar.fallback}
          className="h-6 w-6"
          tooltip={tooltipName}
        />
      )}
      <Message.Bubble>
        <MessageContent message={message} />
      </Message.Bubble>
      {!hideActions && (
        <Message.Actions>
          {isUser && (
            <span
              className="text-sm text-muted-foreground cursor-default opacity-0 group-hover:opacity-100 transition-opacity"
              title={formatFullTimestamp(message.createdAt)}
            >
              {formatTime(message.createdAt)}
            </span>
          )}
          <CopyButton content={getTextContent(message)} />
          {!isUser && enableRegenerate && onRegenerate && (
            <RegenerateButton onRegenerate={() => onRegenerate(message.id)} />
          )}
          {!isUser && (
            <span
              className="text-sm text-muted-foreground cursor-default opacity-0 group-hover:opacity-100 transition-opacity"
              title={formatFullTimestamp(message.createdAt)}
            >
              {formatTime(message.createdAt)}
            </span>
          )}
        </Message.Actions>
      )}
    </Message>
  );
}, areMessageItemsEqual);

MessageItem.displayName = 'MessageItem';

/**
 * Props for MessageListItem - wrapper that handles placeholder messages
 */
interface MessageListItemProps {
  message: TaskMessage;
  index: number;
  messagesLength: number;
  isSubmitting: boolean;
  avatar: { src?: string; fallback: string; name?: string };
  enableRegenerate: boolean;
  onRegenerate?: (messageId: string) => void;
}

/**
 * Custom comparison for MessageListItem
 */
function areMessageListItemsEqual(
  prev: MessageListItemProps,
  next: MessageListItemProps
): boolean {
  // Check placeholder condition first (assistant with no parts)
  const prevIsPlaceholder =
    prev.message.role === 'assistant' && prev.message.parts.length === 0;
  const nextIsPlaceholder =
    next.message.role === 'assistant' && next.message.parts.length === 0;

  if (prevIsPlaceholder !== nextIsPlaceholder) return false;
  if (prevIsPlaceholder && nextIsPlaceholder) {
    // Both are placeholders - visually identical, skip re-render
    // (ID can change from "placeholder-xxx" to server UUID)
    return true;
  }

  // Compute isLastMessage for both
  const prevIsLast = prev.index === prev.messagesLength - 1;
  const nextIsLast = next.index === next.messagesLength - 1;
  if (prevIsLast !== nextIsLast) return false;

  // Delegate to MessageItem's comparison logic
  return areMessageItemsEqual(
    {
      message: prev.message,
      isLastMessage: prevIsLast,
      isSubmitting: prev.isSubmitting,
      avatar: prev.avatar,
      enableRegenerate: prev.enableRegenerate,
      onRegenerate: prev.onRegenerate,
    },
    {
      message: next.message,
      isLastMessage: nextIsLast,
      isSubmitting: next.isSubmitting,
      avatar: next.avatar,
      enableRegenerate: next.enableRegenerate,
      onRegenerate: next.onRegenerate,
    }
  );
}

/**
 * Memoized wrapper component for message list rendering
 * Handles placeholder messages and delegates to MessageItem
 */
export const MessageListItem = memo(function MessageListItem({
  message,
  index,
  messagesLength,
  isSubmitting,
  avatar,
  enableRegenerate,
  onRegenerate,
}: MessageListItemProps) {
  // Check if this is a placeholder (assistant with no parts)
  if (message.role === 'assistant' && message.parts.length === 0) {
    // Render invisible placeholder with min-height for scroll target.
    // 60px ensures the placeholder is tall enough to trigger scrollIntoView
    // positioning correctly, matching approximate height of a minimal message.
    return <div className="min-h-[60px]" />;
  }

  return (
    <MessageItem
      message={message}
      isLastMessage={index === messagesLength - 1}
      isSubmitting={isSubmitting}
      avatar={avatar}
      enableRegenerate={enableRegenerate}
      onRegenerate={onRegenerate}
    />
  );
}, areMessageListItemsEqual);

MessageListItem.displayName = 'MessageListItem';
