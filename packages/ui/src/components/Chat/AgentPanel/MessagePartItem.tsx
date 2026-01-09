import { memo } from 'react';
import type {
  MessagePart,
  TaskMessage,
  TextPart,
  ReasoningPart,
  ToolInvocationPart,
  ToolResultPart,
  ImagePart,
  AgentType,
} from '../../../types/chat';
import { MarkdownRenderer } from '../CodeDisplay/MarkdownRenderer';
import { ReasoningDisplay } from '../AIFeatures/ReasoningDisplay';
import { ToolBadge } from '../ToolDisplay/ToolBadge';
import { SubAgentCard } from '../ToolDisplay/SubAgentCard';
import type { RenderSubAgentCardProps } from './types';

interface MessagePartItemProps {
  part: MessagePart;
  message: TaskMessage; // For finding tool results
  onOpenSubAgentDialog?: (sessionId: string) => void;
  renderSubAgentCard?: (props: RenderSubAgentCardProps) => React.ReactNode;
  /** Available agents for looking up full names from agent IDs */
  agents?: AgentType[];
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
 * Extract error message from tool result
 * Handles string, Error object, or object with message/error property
 */
function extractErrorMessage(result: unknown): string {
  if (typeof result === 'string') {
    return result;
  }
  if (result instanceof Error) {
    return result.message;
  }
  if (typeof result === 'object' && result !== null) {
    const obj = result as Record<string, unknown>;
    if (typeof obj.message === 'string') {
      return obj.message;
    }
    if (typeof obj.error === 'string') {
      return obj.error;
    }
  }
  return 'An error occurred';
}

/**
 * Map tool invocation state to SubAgentCard status
 */
function mapToolStateToSubAgentStatus(
  toolState: ToolInvocationPart['state'],
  result?: ToolResultPart
): 'pending' | 'running' | 'complete' | 'error' {
  if (result?.isError) return 'error';
  switch (toolState) {
    case 'pending':
      return 'pending';
    case 'running':
      return 'running';
    case 'completed':
      return 'complete';
    case 'error':
      return 'error';
    default:
      return 'pending';
  }
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

  // Check callback references
  if (prev.onOpenSubAgentDialog !== next.onOpenSubAgentDialog) return false;
  if (prev.renderSubAgentCard !== next.renderSubAgentCard) return false;
  // Check agents reference (used for name lookup)
  if (prev.agents !== next.agents) return false;

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
  onOpenSubAgentDialog,
  renderSubAgentCard,
  agents,
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

      // Special handling for spawnAgent tool (both server-side 'spawnAgent' and MCP 'mcp__agent-kit-server__spawnAgent')
      if (
        toolPart.toolName === 'spawnAgent' ||
        toolPart.toolName === 'mcp__agent-kit-server__spawnAgent'
      ) {
        // Prefer agentName from result (full display name) over agentId (key used for spawning)
        const resultData = result?.result as {
          sessionId?: string;
          response?: string;
          agentName?: string;
        };
        const agentId = toolPart.args?.agentId as string | undefined;
        // Look up full name: 1) from result, 2) from agents list, 3) fallback to agentId
        const agentFromList = agentId
          ? agents?.find((a) => a.id === agentId)
          : undefined;
        const agentName =
          resultData?.agentName || agentFromList?.name || agentId || 'Agent';
        // Check spawnedSessionId in args (set by spawn_session_created event while running)
        // or fall back to sessionId in tool result (available after completion)
        const sessionId =
          (toolPart.args?.spawnedSessionId as string) || resultData?.sessionId;
        const response = resultData?.response;

        const onOpenFullView =
          sessionId && onOpenSubAgentDialog
            ? () => onOpenSubAgentDialog(sessionId)
            : undefined;

        // Use custom render function if provided (for connected streaming version)
        if (renderSubAgentCard) {
          return (
            <div className="block">
              {renderSubAgentCard({
                sessionId,
                agentName,
                toolState: toolPart.state,
                toolResult: result,
                onOpenFullView,
                onOpenSubAgentDialog,
              })}
            </div>
          );
        }

        // Fallback to default SubAgentCard (static, no streaming)
        return (
          <div className="block">
            <SubAgentCard
              agentName={agentName}
              sessionId={sessionId}
              status={mapToolStateToSubAgentStatus(toolPart.state, result)}
              summary={response?.slice(0, 150)}
              latestAction={
                toolPart.state === 'running' ? 'Processing...' : undefined
              }
              errorMessage={result?.isError ? extractErrorMessage(result.result) : undefined}
              onOpenFullView={onOpenFullView}
            />
          </div>
        );
      }

      // Default ToolBadge for other tools
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
