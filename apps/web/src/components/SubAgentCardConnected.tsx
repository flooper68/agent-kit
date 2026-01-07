import { memo } from 'react';
import { AgentPanel, type CompactStatus } from '@agent-kit/ui';
import {
  useSubAgentStreaming,
  type SubAgentStatus,
} from '../hooks/useSubAgentStreaming';
import { useElapsedTime } from '../hooks/useElapsedTime';
import type { ToolInvocationPart, ToolResultPart } from '@agent-kit/ui';

/**
 * Map SubAgentStatus to CompactStatus
 */
function mapSubAgentStatusToCompactStatus(
  status: SubAgentStatus
): CompactStatus {
  switch (status) {
    case 'idle':
      return 'pending';
    case 'active':
      return 'running';
    case 'complete':
      return 'complete';
    case 'error':
      return 'error';
  }
}

/**
 * Map tool invocation state to CompactStatus
 */
function mapToolStateToCompactStatus(
  toolState: ToolInvocationPart['state'],
  result?: ToolResultPart
): CompactStatus {
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

export interface SubAgentCardConnectedProps {
  /** Session ID for the sub-agent (available after spawning) */
  sessionId: string | undefined;
  /** Name of the agent */
  agentName: string;
  /** Tool invocation state */
  toolState: ToolInvocationPart['state'];
  /** Tool result (if available) */
  toolResult?: ToolResultPart;
  /** Callback when "Open Full View" is clicked */
  onOpenFullView?: () => void;
  /** Callback for retry on error */
  onRetry?: () => void;
  /** Callback when a nested sub-agent dialog should open */
  onOpenSubAgentDialog?: (sessionId: string) => void;
}

/**
 * SubAgentCardConnected is a connected version of the compact AgentPanel
 * that subscribes to sub-agent session streaming and displays real-time updates.
 *
 * This component bridges the UI package (which has no trpc) with the web app
 * (which has trpc and can subscribe to streaming sessions).
 */
export const SubAgentCardConnected = memo(function SubAgentCardConnected({
  sessionId,
  agentName,
  toolState,
  toolResult,
  onOpenFullView,
  onRetry,
  onOpenSubAgentDialog,
}: SubAgentCardConnectedProps) {
  // Subscribe to the sub-agent session stream when we have a sessionId
  const streaming = useSubAgentStreaming({
    sessionId: sessionId ?? null,
    enabled: !!sessionId,
  });

  // Determine the status to display
  // Check tool result error first (highest priority)
  // Even if we have a sessionId and streaming status, a tool error should take precedence
  const compactStatus: CompactStatus = toolResult?.isError
    ? 'error'
    : sessionId
      ? mapSubAgentStatusToCompactStatus(streaming.status)
      : mapToolStateToCompactStatus(toolState, toolResult);

  // Compute whether this sub-agent is currently "running" for elapsed time tracking
  const isRunning = compactStatus === 'pending' || compactStatus === 'running';

  // Convert streamingStartTime to formatted elapsed label
  const { formattedElapsed: elapsedLabel } = useElapsedTime({
    startTime: streaming.streamingStartTime,
    isRunning,
  });

  return (
    <AgentPanel
      variant="compact"
      agentName={agentName}
      compactStatus={compactStatus}
      compactElapsedLabel={elapsedLabel}
      messages={streaming.messages}
      onOpenFullView={onOpenFullView}
      onCompactRetry={onRetry}
      onOpenSubAgentDialog={onOpenSubAgentDialog}
      // Required props for AgentPanel (no-op for compact mode)
      status="ready"
      onSend={() => {}}
    />
  );
});
