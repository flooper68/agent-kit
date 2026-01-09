import type { ReactNode } from 'react';
import { memo, useCallback, useMemo } from 'react';
import { Bot, X } from 'lucide-react';
import { Dialog } from '../../Dialog';
import { Button } from '../../Button';
import { cn } from '../../../lib/utils';
import type {
  TaskMessage,
  TaskStatus,
  TodoItem,
  ContextUsage,
  AgentType,
} from '../../../types/chat';
import { AgentPanel, type RenderSubAgentCardProps } from '../AgentPanel';

export type SubAgentSessionStatus = 'active' | 'complete' | 'error';

export interface SubAgentFullViewDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;

  /** Agent name to display */
  agentName?: string;
  /** Messages to display */
  messages: TaskMessage[];
  /** Current status */
  status: SubAgentSessionStatus;
  /** Whether currently streaming */
  isStreaming: boolean;

  /** Token usage stats */
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };

  /** Current todos from the sub-agent */
  todos?: TodoItem[];

  /** Full agent definition for displaying agent info badge */
  agent?: AgentType;

  /** Formatted elapsed time label for running time indicator (e.g., "5s" or "1m 23s"). Pass null to hide. */
  elapsedLabel?: string | null;

  /** Callback when user clicks the inspect button */
  onInspect?: () => void;

  /** Callback when user wants to open a nested sub-agent's full view dialog */
  onOpenSubAgentDialog?: (sessionId: string) => void;

  /** Custom render function for nested sub-agent cards (enables streaming) */
  renderSubAgentCard?: (props: RenderSubAgentCardProps) => ReactNode;

  /** Avatar configuration for messages. For spawned sessions, user avatar should show the parent agent. */
  avatars?: {
    user?: { src?: string; fallback?: string; name?: string };
    assistant?: { src?: string; fallback?: string; name?: string };
  };
}

/**
 * Map SubAgentSessionStatus to TaskStatus for AgentPanel
 */
function mapToTaskStatus(
  status: SubAgentSessionStatus,
  isStreaming: boolean
): TaskStatus {
  if (status === 'error') return 'error';
  if (status === 'complete') return 'ready';
  // active status
  if (isStreaming) return 'streaming';
  return 'submitted';
}

const statusConfig: Record<
  SubAgentSessionStatus,
  { label: string; className: string }
> = {
  active: {
    label: 'Running',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  complete: {
    label: 'Complete',
    className: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
  error: {
    label: 'Error',
    className: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
};

/**
 * Custom comparison function for memoization
 */
function areSubAgentFullViewDialogPropsEqual(
  prev: SubAgentFullViewDialogProps,
  next: SubAgentFullViewDialogProps
): boolean {
  if (prev.open !== next.open) return false;
  if (prev.agentName !== next.agentName) return false;
  if (prev.status !== next.status) return false;
  if (prev.isStreaming !== next.isStreaming) return false;
  if (prev.messages.length !== next.messages.length) return false;

  // Check message IDs (quick check without deep comparison)
  const prevLastMessage = prev.messages[prev.messages.length - 1];
  const nextLastMessage = next.messages[next.messages.length - 1];
  if (prevLastMessage?.id !== nextLastMessage?.id) return false;

  // Check todos
  if (prev.todos?.length !== next.todos?.length) return false;

  // Check usage
  if (prev.usage?.promptTokens !== next.usage?.promptTokens) return false;
  if (prev.usage?.completionTokens !== next.usage?.completionTokens)
    return false;

  // Check agent
  if (prev.agent?.id !== next.agent?.id) return false;

  // Check elapsedLabel
  if (prev.elapsedLabel !== next.elapsedLabel) return false;

  // Check onInspect
  if (prev.onInspect !== next.onInspect) return false;

  // Check avatars (shallow comparison)
  if (prev.avatars?.user?.fallback !== next.avatars?.user?.fallback)
    return false;
  if (prev.avatars?.user?.name !== next.avatars?.user?.name) return false;

  return true;
}

// Assume 200K context window for sub-agents (Claude 3.5 Sonnet default)
const DEFAULT_CONTEXT_LIMIT = 200000;

export const SubAgentFullViewDialog = memo(function SubAgentFullViewDialog({
  open,
  onOpenChange,
  agentName,
  messages,
  status,
  isStreaming,
  usage,
  todos,
  agent,
  elapsedLabel,
  onInspect,
  onOpenSubAgentDialog,
  renderSubAgentCard,
  avatars,
}: SubAgentFullViewDialogProps) {
  // Map status for AgentPanel
  const taskStatus = useMemo(
    () => mapToTaskStatus(status, isStreaming),
    [status, isStreaming]
  );

  // No-op send handler since input is disabled
  const handleSend = useCallback(() => {}, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const statusInfo = statusConfig[status];

  // Convert usage to ContextUsage format for AgentPanel
  const contextUsage: ContextUsage | undefined = useMemo(() => {
    if (!usage) return undefined;
    const totalTokens = usage.promptTokens + usage.completionTokens;
    return {
      used: totalTokens,
      total: DEFAULT_CONTEXT_LIMIT,
      percentage: Math.round((totalTokens / DEFAULT_CONTEXT_LIMIT) * 100),
    };
  }, [usage]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content size="viewport" className="flex flex-col p-0 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <Dialog.Title className="font-medium text-sm">
                {agentName || 'Sub-Agent'}
              </Dialog.Title>
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full w-fit',
                  statusInfo.className
                )}
              >
                {isStreaming ? 'Streaming...' : statusInfo.label}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          <AgentPanel
            messages={messages}
            status={taskStatus}
            inputDisabled
            onSend={handleSend}
            todos={todos}
            contextUsage={contextUsage}
            selectedAgent={agent}
            elapsedLabel={elapsedLabel}
            onInspect={onInspect}
            onOpenSubAgentDialog={onOpenSubAgentDialog}
            renderSubAgentCard={renderSubAgentCard}
            avatars={avatars}
          />
        </div>
      </Dialog.Content>
    </Dialog>
  );
}, areSubAgentFullViewDialogPropsEqual);
