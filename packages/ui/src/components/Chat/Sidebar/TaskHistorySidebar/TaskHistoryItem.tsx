import { forwardRef } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { TaskHistoryItem as TaskHistoryItemType } from '../../../../types/chat';

export interface TaskHistoryItemProps {
  task: TaskHistoryItemType;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}

const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return 'Today';
  }
  if (days === 1) {
    return 'Yesterday';
  }
  if (days < 7) {
    return `${days} days ago`;
  }
  return date.toLocaleDateString();
};

const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return tokens.toString();
};

export const TaskHistoryItemComponent = forwardRef<
  HTMLDivElement,
  TaskHistoryItemProps
>(({ task, isSelected, onSelect, onDelete }, ref) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={cn(
        'group relative flex flex-col py-1.5 px-2 rounded-lg cursor-pointer transition-colors border border-border',
        isSelected
          ? 'bg-primary/10 text-foreground'
          : 'hover:bg-muted text-foreground'
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <h4 className="text-sm font-medium truncate flex-1">
          {task.title || 'Untitled Task'}
        </h4>

        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {(task.description || task.preview) && (
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {task.description || task.preview}
        </p>
      )}

      <div className="flex items-center justify-between mt-0.5 text-xs text-muted-foreground/60">
        <span>{formatDate(task.updatedAt ?? task.createdAt)}</span>
        <div className="flex items-center gap-1.5">
          {task.agentName && <span>{task.agentName}</span>}
          {task.agentName &&
            task.totalTokens != null &&
            task.totalTokens > 0 && <span>·</span>}
          {task.totalTokens != null && task.totalTokens > 0 && (
            <span>{formatTokens(task.totalTokens)} tokens</span>
          )}
        </div>
      </div>
    </div>
  );
});

TaskHistoryItemComponent.displayName = 'TaskHistoryItem';
