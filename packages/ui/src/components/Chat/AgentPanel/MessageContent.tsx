import { memo } from 'react';
import type {
  TaskMessage,
  TextPart,
  ReasoningPart,
  ToolInvocationPart,
  AgentType,
} from '../../../types/chat';
import { MessagePartItem } from './MessagePartItem';
import type { RenderSubAgentCardProps } from './types';

interface MessageContentProps {
  message: TaskMessage;
  onOpenSubAgentDialog?: (sessionId: string) => void;
  renderSubAgentCard?: (props: RenderSubAgentCardProps) => React.ReactNode;
  /** Available agents for looking up full names from agent IDs */
  agents?: AgentType[];
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
  // Check callback references
  if (prev.onOpenSubAgentDialog !== next.onOpenSubAgentDialog) return false;
  if (prev.renderSubAgentCard !== next.renderSubAgentCard) return false;
  // Check agents reference (used for name lookup)
  if (prev.agents !== next.agents) return false;

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
  onOpenSubAgentDialog,
  renderSubAgentCard,
  agents,
}: MessageContentProps) {
  return (
    <div className="space-y-2 w-full">
      {message.parts.map((part) => (
        <MessagePartItem
          key={part.id}
          part={part}
          message={message}
          onOpenSubAgentDialog={onOpenSubAgentDialog}
          renderSubAgentCard={renderSubAgentCard}
          agents={agents}
        />
      ))}
    </div>
  );
}, areMessagesContentEqual);

MessageContent.displayName = 'MessageContent';
