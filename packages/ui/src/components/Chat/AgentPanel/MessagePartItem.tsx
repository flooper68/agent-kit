import { memo } from 'react';
import type {
  MessagePart,
  TaskMessage,
  TextPart,
  ReasoningPart,
  ToolInvocationPart,
  ToolResultPart,
  ImagePart,
} from '../../../types/chat';
import { MarkdownRenderer } from '../CodeDisplay/MarkdownRenderer';
import { ReasoningDisplay } from '../AIFeatures/ReasoningDisplay';
import { ToolBadge } from '../ToolDisplay/ToolBadge';

interface MessagePartItemProps {
  part: MessagePart;
  message: TaskMessage; // For finding tool results
}

/**
 * Find the tool result for a given tool call ID within a message
 */
function findToolResult(
  message: TaskMessage,
  toolCallId: string
): ToolResultPart | undefined {
  return message.parts.find(
    (p): p is ToolResultPart =>
      p.type === 'tool_result' && p.toolCallId === toolCallId
  );
}

/**
 * Custom comparison function for MessagePartItem
 * Compares primitive values to determine if re-render is needed
 */
function areMessagePartsEqual(
  prev: MessagePartItemProps,
  next: MessagePartItemProps
): boolean {
  // Different part IDs means different parts
  // Skip for reasoning - content comparison determines equality (ID can change during streaming)
  if (prev.part.id !== next.part.id && prev.part.type !== 'reasoning') {
    return false;
  }
  // Different types means different parts
  if (prev.part.type !== next.part.type) return false;

  // Type-specific content comparisons
  switch (prev.part.type) {
    case 'text':
      return (
        (prev.part as TextPart).content === (next.part as TextPart).content
      );
    case 'reasoning': {
      const prevReasoning = prev.part as ReasoningPart;
      const nextReasoning = next.part as ReasoningPart;
      return (
        prevReasoning.content === nextReasoning.content &&
        prevReasoning.isCollapsed === nextReasoning.isCollapsed &&
        prevReasoning.durationSeconds === nextReasoning.durationSeconds
      );
    }
    case 'tool_invocation': {
      const prevTool = prev.part as ToolInvocationPart;
      const nextTool = next.part as ToolInvocationPart;
      // Also check if message changed (for tool result lookup)
      return (
        prevTool.state === nextTool.state &&
        prevTool.toolCallId === nextTool.toolCallId &&
        prev.message.id === next.message.id &&
        prev.message.parts.length === next.message.parts.length
      );
    }
    case 'image': {
      const prevImage = prev.part as ImagePart;
      const nextImage = next.part as ImagePart;
      return prevImage.url === nextImage.url && prevImage.alt === nextImage.alt;
    }
    case 'tool_result':
      // Tool results are rendered as part of tool_invocation, skip
      return true;
    default:
      return true;
  }
}

/**
 * Memoized component for rendering individual message parts
 * Uses custom comparison to prevent unnecessary re-renders
 */
export const MessagePartItem = memo(function MessagePartItem({
  part,
  message,
}: MessagePartItemProps) {
  switch (part.type) {
    case 'text': {
      const textPart = part as TextPart;
      return <MarkdownRenderer content={textPart.content} />;
    }
    case 'reasoning': {
      const reasoningPart = part as ReasoningPart;
      return (
        <ReasoningDisplay
          content={reasoningPart.content}
          expanded={!reasoningPart.isCollapsed}
          durationSeconds={reasoningPart.durationSeconds}
        />
      );
    }
    case 'tool_invocation': {
      const toolPart = part as ToolInvocationPart;
      const result = findToolResult(message, toolPart.toolCallId);
      return (
        <div className="block">
          <ToolBadge
            toolName={toolPart.toolName}
            state={toolPart.state}
            args={toolPart.args}
            toolCallId={toolPart.toolCallId}
            result={result}
          />
        </div>
      );
    }
    case 'image': {
      const imagePart = part as ImagePart;
      return (
        <img
          src={imagePart.url}
          alt={imagePart.alt ?? 'Image'}
          className="max-w-full rounded-lg"
        />
      );
    }
    case 'tool_result':
      // Tool results are rendered inline with tool_invocation
      return null;
    default:
      return null;
  }
}, areMessagePartsEqual);

MessagePartItem.displayName = 'MessagePartItem';
