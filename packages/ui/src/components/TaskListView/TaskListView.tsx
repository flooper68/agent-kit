import { useState, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { PriorityBadge, type Priority } from '../PriorityBadge';
import { StatusBadge, type TaskStatus } from '../StatusBadge';
import { Paperclip, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface TaskListItem {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate?: Date | null;
  completedAt?: Date | null;
  artifactCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type SortField = 'title' | 'status' | 'priority' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface TaskListViewProps {
  tasks: TaskListItem[];
  onTaskClick?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  emptyMessage?: string;
  className?: string;
  defaultSort?: SortField;
  defaultSortDirection?: SortDirection;
}

const priorityOrder: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const statusOrder: Record<TaskStatus, number> = {
  backlog: 1,
  todo: 2,
  in_progress: 3,
  review: 4,
  done: 5,
};

export function TaskListView({
  tasks,
  onTaskClick,
  onStatusChange: _onStatusChange,
  emptyMessage = 'No tasks found',
  className,
  defaultSort = 'createdAt',
  defaultSortDirection = 'desc',
}: TaskListViewProps) {
  const [sortField, setSortField] = useState<SortField>(defaultSort);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(defaultSortDirection);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [tasks, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

  if (tasks.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center py-12 text-muted-foreground',
          className
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="grid grid-cols-[1fr_100px_100px_80px] gap-4 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border">
        <button
          className="flex items-center gap-1 hover:text-foreground transition-colors text-left"
          onClick={() => handleSort('title')}
        >
          Title <SortIcon field="title" />
        </button>
        <button
          className="flex items-center gap-1 hover:text-foreground transition-colors text-left"
          onClick={() => handleSort('status')}
        >
          Status <SortIcon field="status" />
        </button>
        <button
          className="flex items-center gap-1 hover:text-foreground transition-colors text-left"
          onClick={() => handleSort('priority')}
        >
          Priority <SortIcon field="priority" />
        </button>
        <div className="text-right">Attachments</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {sortedTasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              'grid grid-cols-[1fr_100px_100px_80px] gap-4 px-4 py-3 items-center',
              onTaskClick &&
                'cursor-pointer hover:bg-muted/30 transition-colors'
            )}
            onClick={() => onTaskClick?.(task.id)}
            role={onTaskClick ? 'button' : undefined}
            tabIndex={onTaskClick ? 0 : undefined}
            onKeyDown={
              onTaskClick
                ? (e) => e.key === 'Enter' && onTaskClick(task.id)
                : undefined
            }
          >
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{task.title}</p>
              {task.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {task.description}
                </p>
              )}
            </div>
            <div>
              <StatusBadge status={task.status} />
            </div>
            <div>
              <PriorityBadge priority={task.priority} />
            </div>
            <div className="text-right">
              {task.artifactCount && task.artifactCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Paperclip className="h-3 w-3" />
                  {task.artifactCount}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">-</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

TaskListView.displayName = 'TaskListView';
