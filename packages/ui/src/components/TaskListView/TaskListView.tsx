import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../lib/utils';
import { PriorityBadge, type Priority } from '../PriorityBadge';
import { StatusBadge, type TaskStatus } from '../StatusBadge';
import {
  Paperclip,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from 'lucide-react';

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
  position?: number;
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
  /** Enable drag-and-drop reordering */
  sortable?: boolean;
  /** Callback when a task is moved via drag-and-drop */
  onTaskMove?: (taskId: string, newPosition: number) => void;
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

interface SortableTaskRowProps {
  task: TaskListItem;
  onTaskClick?: (taskId: string) => void;
}

function SortableTaskRow({ task, onTaskClick }: SortableTaskRowProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      id: task.id,
    });

  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition: transform ? 'transform 200ms ease' : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'grid grid-cols-[32px_1fr_100px_100px_80px] gap-4 px-4 py-3 items-center bg-background',
        isDragging && 'opacity-50',
        onTaskClick && 'cursor-pointer hover:bg-muted/30 transition-colors'
      )}
      data-task-id={task.id}
    >
      <div
        className="flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div
        className="min-w-0"
        onClick={() => onTaskClick?.(task.id)}
        role={onTaskClick ? 'button' : undefined}
        tabIndex={onTaskClick ? 0 : undefined}
        onKeyDown={
          onTaskClick
            ? (e) => e.key === 'Enter' && onTaskClick(task.id)
            : undefined
        }
      >
        <p className="font-medium text-sm truncate">{task.title}</p>
        {task.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {task.description}
          </p>
        )}
      </div>
      <div onClick={() => onTaskClick?.(task.id)}>
        <StatusBadge status={task.status} />
      </div>
      <div onClick={() => onTaskClick?.(task.id)}>
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="text-right" onClick={() => onTaskClick?.(task.id)}>
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
  );
}

function TaskRowContent({ task }: { task: TaskListItem }) {
  return (
    <>
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
    </>
  );
}

export function TaskListView({
  tasks,
  onTaskClick,
  onStatusChange: _onStatusChange,
  emptyMessage = 'No tasks found',
  className,
  defaultSort = 'createdAt',
  defaultSortDirection = 'desc',
  sortable = false,
  onTaskMove,
}: TaskListViewProps) {
  const [sortField, setSortField] = useState<SortField>(defaultSort);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(defaultSortDirection);
  const [activeId, setActiveId] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleSort = (field: SortField) => {
    if (sortable) return; // Disable column sorting when in sortable mode
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // In sortable mode, use tasks as-is (sorted by position from backend)
  // Otherwise, apply client-side sorting
  const displayTasks = useMemo(() => {
    if (sortable) {
      return tasks;
    }
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
  }, [tasks, sortField, sortDirection, sortable]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      const activeIndex = displayTasks.findIndex((t) => t.id === active.id);
      const overIndex = displayTasks.findIndex((t) => t.id === over.id);

      if (activeIndex === -1 || overIndex === -1) return;

      // Calculate new position using arrayMove logic
      // The position we send must match what the optimistic update expects:
      // it splices at `position` after removing the task from the array
      const reordered = arrayMove(displayTasks, activeIndex, overIndex);
      const newPosition = reordered.findIndex((t) => t.id === active.id);

      onTaskMove?.(active.id as string, newPosition);
    },
    [displayTasks, onTaskMove]
  );

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortable) {
      return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    }
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

  const gridCols = sortable
    ? 'grid-cols-[32px_1fr_100px_100px_80px]'
    : 'grid-cols-[1fr_100px_100px_80px]';

  const content = (
    <div
      className={cn(
        'rounded-lg border border-border overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'grid gap-4 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border',
          gridCols
        )}
      >
        {sortable ? (
          <>
            <div />
            <div>Title</div>
            <div>Status</div>
            <div>Priority</div>
            <div className="text-right">Attachments</div>
          </>
        ) : (
          <>
            <button
              className="flex items-center gap-1 hover:text-foreground transition-colors text-left cursor-pointer"
              onClick={() => handleSort('title')}
            >
              Title <SortIcon field="title" />
            </button>
            <button
              className="flex items-center gap-1 hover:text-foreground transition-colors text-left cursor-pointer"
              onClick={() => handleSort('status')}
            >
              Status <SortIcon field="status" />
            </button>
            <button
              className="flex items-center gap-1 hover:text-foreground transition-colors text-left cursor-pointer"
              onClick={() => handleSort('priority')}
            >
              Priority <SortIcon field="priority" />
            </button>
            <div className="text-right">Attachments</div>
          </>
        )}
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {sortable ? (
          <SortableContext
            items={displayTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {displayTasks.map((task) => (
              <SortableTaskRow
                key={task.id}
                task={task}
                onTaskClick={onTaskClick}
              />
            ))}
          </SortableContext>
        ) : (
          displayTasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'grid gap-4 px-4 py-3 items-center',
                gridCols,
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
              <TaskRowContent task={task} />
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (sortable) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {content}
        <DragOverlay dropAnimation={null}>
          {activeTask && (
            <div
              className={cn(
                'grid gap-4 px-4 py-3 items-center bg-background border border-border rounded-lg shadow-lg',
                gridCols
              )}
            >
              <div className="flex items-center justify-center text-muted-foreground">
                <GripVertical className="h-4 w-4" />
              </div>
              <TaskRowContent task={activeTask} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    );
  }

  return content;
}

TaskListView.displayName = 'TaskListView';
