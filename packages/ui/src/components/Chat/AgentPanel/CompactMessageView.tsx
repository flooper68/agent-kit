import { memo, useMemo } from 'react';
import { cn } from '../../../lib/utils';
import type { TaskMessage, MessagePart, AgentType } from '../../../types/chat';
import { MessagePartItem } from './MessagePartItem';

interface CompactMessageViewProps {
  /** Messages to display (shows last meaningful part) */
  messages: TaskMessage[];
  /** Callback when a sub-agent dialog should open */
  onOpenSubAgentDialog?: (sessionId: string) => void;
  /** Available agents for looking up full names from agent IDs */
  agents?: AgentType[];
}

/**
 * Get the last meaningful part from the messages
 * Skips tool_result parts as they are rendered inline with tool_invocation
 */
function getLastMeaningfulPart(messages: TaskMessage[]): {
  part: MessagePart;
  message: TaskMessage;
} | null {
  // Iterate from last message backwards
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (!message || message.role !== 'assistant') continue;

    // Find last non-tool-result part in this message
    for (let j = message.parts.length - 1; j >= 0; j--) {
      const part = message.parts[j];
      if (part && part.type !== 'tool_result') {
        return { part, message };
      }
    }
  }
  return null;
}

/**
 * CompactMessageView renders the last meaningful part from messages.
 * Parent container handles max-height and overflow; this component just renders content.
 * Uses flex-end alignment in parent to show most recent content.
 */
export const CompactMessageView = memo(function CompactMessageView({
  messages,
  onOpenSubAgentDialog,
  agents,
}: CompactMessageViewProps) {
  const lastContent = useMemo(
    () => getLastMeaningfulPart(messages),
    [messages]
  );

  if (!lastContent) {
    return (
      <span className="text-xs text-muted-foreground italic">
        Starting agent...
      </span>
    );
  }

  return (
    <div
      className={cn(
        'text-[11px]',
        // Markdown content styling adjustments for compact view
        '[&_p]:m-0 [&_pre]:my-1 [&_pre]:text-[10px] [&_code]:text-[10px]',
        '[&_.reasoning-display]:text-[10px]'
      )}
    >
      <MessagePartItem
        part={lastContent.part}
        message={lastContent.message}
        onOpenSubAgentDialog={onOpenSubAgentDialog}
        agents={agents}
      />
    </div>
  );
});

CompactMessageView.displayName = 'CompactMessageView';
