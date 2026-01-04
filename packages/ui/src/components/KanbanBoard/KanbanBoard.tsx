import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../lib/utils';
import { KanbanColumn } from '../KanbanColumn';
import { TaskCard } from '../TaskCard';
import type { Priority } from '../PriorityBadge';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export interface KanbanTask {
  id: string;
  title: string;
  description?: string | null;
  priority: Priority;
  status: TaskStatus;
  position?: number;
  artifactCount?: number;
}

export interface KanbanBoardProps {
  tasks: KanbanTask[];
  onTaskMove?: (
    taskId: string,
    newStatus: TaskStatus,
    newPosition: number
  ) => void;
  onTaskClick?: (taskId: string) => void;
  className?: string;
}

interface SortableTaskProps {
  task: KanbanTask;
  onClick?: () => void;
}

function SortableTask({ task, onClick }: SortableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      id: task.id,
    });

  const style = {
    // Apply transform for drag preview, but no transition to disable drop animation
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        id={task.id}
        title={task.title}
        description={task.description}
        priority={task.priority}
        artifactCount={task.artifactCount}
        onClick={onClick}
        isDragging={isDragging}
      />
    </div>
  );
}

// Backlog is excluded from Kanban view - it has its own separate tab
const columnConfig: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'Todo' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

export function KanbanBoard({
  tasks,
  onTaskMove,
  onTaskClick,
  className,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Group tasks by status and sort by position
  const tasksByStatus = columnConfig.reduce(
    (acc, col) => {
      acc[col.id] = tasks
        .filter((t) => t.status === col.id)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      return acc;
    },
    {} as Record<TaskStatus, KanbanTask[]>
  );

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const activeTaskId = active.id as string;
      const overId = over.id as string;

      // Find the task being dragged
      const activeTask = tasks.find((t) => t.id === activeTaskId);
      if (!activeTask) return;

      // Determine the target column
      let targetStatus: TaskStatus;
      let targetPosition: number;

      // Check if dropped on a column
      if (columnConfig.some((col) => col.id === overId)) {
        targetStatus = overId as TaskStatus;
        targetPosition = tasksByStatus[targetStatus].length;
      } else {
        // Dropped on another task
        const overTask = tasks.find((t) => t.id === overId);
        if (!overTask) return;

        targetStatus = overTask.status;
        const tasksInColumn = tasksByStatus[targetStatus];
        const overIndex = tasksInColumn.findIndex((t) => t.id === overId);

        // If same column, use arrayMove to calculate new position
        if (activeTask.status === targetStatus) {
          const activeIndex = tasksInColumn.findIndex(
            (t) => t.id === activeTaskId
          );
          if (activeIndex === overIndex) return; // No change

          // Calculate the new position based on reordering
          const reordered = arrayMove(tasksInColumn, activeIndex, overIndex);
          targetPosition = reordered.findIndex((t) => t.id === activeTaskId);
        } else {
          // Moving to different column
          targetPosition = overIndex;
        }
      }

      // Always call onTaskMove for any drag completion
      onTaskMove?.(activeTaskId, targetStatus, targetPosition);
    },
    [tasks, tasksByStatus, onTaskMove]
  );

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Could be used for preview updates
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className={cn('flex gap-4 overflow-x-auto pb-4 h-full', className)}>
        {columnConfig.map((col) => {
          const columnTasks = tasksByStatus[col.id];
          return (
            <div key={col.id} className="w-72 flex-shrink-0 h-full">
              <KanbanColumn
                id={col.id}
                title={col.title}
                count={columnTasks.length}
                itemIds={columnTasks.map((t) => t.id)}
              >
                {columnTasks.map((task) => (
                  <SortableTask
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick?.(task.id)}
                  />
                ))}
              </KanbanColumn>
            </div>
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <TaskCard
            id={activeTask.id}
            title={activeTask.title}
            description={activeTask.description}
            priority={activeTask.priority}
            artifactCount={activeTask.artifactCount}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

KanbanBoard.displayName = 'KanbanBoard';
