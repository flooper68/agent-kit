import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';
import type { TaskHistoryItem as TaskHistoryItemType } from '../../../../types/chat';

export interface TaskHistoryItemProps {
  task: TaskHistoryItemType;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}

// Trash icon
const TrashIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

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
        'group relative flex flex-col gap-1 p-3 rounded-lg cursor-pointer transition-colors',
        isSelected
          ? 'bg-primary/10 text-foreground'
          : 'hover:bg-muted text-foreground'
      )}
    >
      <div className="flex items-start justify-between gap-2">
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
            <TrashIcon />
          </button>
        )}
      </div>

      {task.preview && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {task.preview}
        </p>
      )}

      <p className="text-xs text-muted-foreground/60">
        {formatDate(task.updatedAt ?? task.createdAt)}
      </p>
    </div>
  );
});

TaskHistoryItemComponent.displayName = 'TaskHistoryItem';
