import { forwardRef, useState } from 'react';
import { cn } from '../../../../lib/utils';
import { ToolBadge } from '../ToolBadge';
import type {
  ToolInvocationPart,
  ToolResultPart,
} from '../../../../types/chat';

interface ToolItem {
  invocation: ToolInvocationPart;
  result?: ToolResultPart;
}

export interface ToolBadgeGroupProps {
  tools: ToolItem[];
  maxVisible?: number;
  onToolClick?: (toolCallId: string) => void;
}

export const ToolBadgeGroup = forwardRef<HTMLDivElement, ToolBadgeGroupProps>(
  ({ tools, maxVisible = 2, onToolClick }, ref) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (tools.length === 0) {
      return null;
    }

    const visibleTools = isExpanded ? tools : tools.slice(0, maxVisible);
    const hiddenCount = tools.length - maxVisible;
    const hasHiddenTools = hiddenCount > 0 && !isExpanded;

    // Count errors in hidden tools
    const hiddenErrorCount = isExpanded
      ? 0
      : tools.slice(maxVisible).filter((t) => t.invocation.state === 'error')
          .length;

    return (
      <div
        ref={ref}
        className="flex flex-nowrap items-center gap-1.5 overflow-x-auto"
      >
        {visibleTools.map((tool) => (
          <ToolBadge
            key={tool.invocation.toolCallId}
            toolName={tool.invocation.toolName}
            state={tool.invocation.state}
            onClick={
              onToolClick
                ? () => onToolClick(tool.invocation.toolCallId)
                : undefined
            }
          />
        ))}

        {hasHiddenTools && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              'bg-muted text-muted-foreground hover:bg-muted/80 transition-colors'
            )}
          >
            <span>+{hiddenCount} more</span>
            {hiddenErrorCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px]">
                {hiddenErrorCount}
              </span>
            )}
          </button>
        )}

        {isExpanded && tools.length > maxVisible && (
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              'bg-muted text-muted-foreground hover:bg-muted/80 transition-colors'
            )}
          >
            Show less
          </button>
        )}
      </div>
    );
  }
);

ToolBadgeGroup.displayName = 'ToolBadgeGroup';
