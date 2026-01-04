import { useState, useCallback, useRef, useEffect } from 'react';
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
  type DragOverEvent,
  type DragCancelEvent,
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
    // Only apply transform when not dragging - DragOverlay handles the visual preview during drag
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition: transform ? 'transform 200ms ease' : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="select-none"
      data-task-id={task.id}
      {...attributes}
      {...listeners}
    >
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

// Invisible placeholder element rendered in destination column during cross-column drag
function SortablePlaceholder({ id, height }: { id: string; height: number }) {
  const { setNodeRef } = useSortable({ id });

  return <div ref={setNodeRef} style={{ height }} />;
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
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Refs to track current values and prevent race conditions
  const overColumnRef = useRef<TaskStatus | null>(null);
  const overIndexRef = useRef<number | null>(null);
  const overTaskIdRef = useRef<string | null>(null);
  const [lastDroppedId, setLastDroppedId] = useState<string | null>(null);

  // Scroll dropped task into view
  useEffect(() => {
    if (lastDroppedId) {
      // Small delay to allow DOM to update after drop
      const timer = setTimeout(() => {
        const element = document.querySelector(
          `[data-task-id="${lastDroppedId}"]`
        );
        element?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
        setLastDroppedId(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [lastDroppedId]);

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

      // Capture current cross-column state before resetting
      const crossColumnTarget = overColumnRef.current;
      const crossColumnIndex = overIndexRef.current;

      setActiveId(null);
      setOverColumn(null);
      setOverIndex(null);
      overColumnRef.current = null;
      overIndexRef.current = null;
      overTaskIdRef.current = null;

      if (!over) return;

      const activeTaskId = active.id as string;
      const overId = over.id as string;

      // Find the task being dragged
      const activeTask = tasks.find((t) => t.id === activeTaskId);
      if (!activeTask) return;

      // Determine the target column
      let targetStatus: TaskStatus;
      let targetPosition: number;

      // If we have cross-column state (dropped on placeholder or tracked position)
      if (crossColumnTarget && crossColumnIndex !== null) {
        targetStatus = crossColumnTarget;
        targetPosition = crossColumnIndex;
      }
      // Check if dropped on a column
      else if (columnConfig.some((col) => col.id === overId)) {
        targetStatus = overId as TaskStatus;
        targetPosition = tasksByStatus[targetStatus].length;
      } else {
        // Dropped on another task
        const overTask = tasks.find((t) => t.id === overId);
        if (!overTask) return;

        targetStatus = overTask.status;
        const tasksInColumn = tasksByStatus[targetStatus];
        const overTaskIndex = tasksInColumn.findIndex((t) => t.id === overId);

        // If same column, use arrayMove to calculate new position
        if (activeTask.status === targetStatus) {
          const activeIndex = tasksInColumn.findIndex(
            (t) => t.id === activeTaskId
          );
          if (activeIndex === overTaskIndex) return; // No change

          // Calculate the new position based on reordering
          const reordered = arrayMove(
            tasksInColumn,
            activeIndex,
            overTaskIndex
          );
          targetPosition = reordered.findIndex((t) => t.id === activeTaskId);
        } else {
          // Moving to different column
          targetPosition = overTaskIndex;
        }
      }

      // Only call onTaskMove if there's an actual change
      if (
        targetStatus !== activeTask.status ||
        targetPosition !== (activeTask.position ?? 0)
      ) {
        onTaskMove?.(activeTaskId, targetStatus, targetPosition);
        setLastDroppedId(activeTaskId);
      }
    },
    [tasks, tasksByStatus, onTaskMove]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || !active) {
        if (overColumnRef.current !== null) {
          overColumnRef.current = null;
          overIndexRef.current = null;
          overTaskIdRef.current = null;
          setOverColumn(null);
          setOverIndex(null);
        }
        return;
      }

      const activeTaskId = active.id as string;
      const overId = over.id as string;

      // If hovering over our own placeholder, keep current state
      if (overId === activeTaskId) {
        return;
      }

      // If still hovering over the same task/column, don't recalculate
      // This prevents oscillation when items shift
      if (overId === overTaskIdRef.current) {
        return;
      }

      const activeTask = tasks.find((t) => t.id === activeTaskId);
      if (!activeTask) return;

      // Determine which column we're over
      let targetColumn: TaskStatus | null = null;
      let targetIndex: number | null = null;

      if (columnConfig.some((col) => col.id === overId)) {
        // Over a column directly (empty area)
        targetColumn = overId as TaskStatus;
        targetIndex = tasksByStatus[targetColumn].length;
      } else {
        // Over a task
        const overTask = tasks.find((t) => t.id === overId);
        if (overTask) {
          targetColumn = overTask.status;
          const tasksInColumn = tasksByStatus[targetColumn];
          const taskIndex = tasksInColumn.findIndex((t) => t.id === overId);

          // If hovering over the last task and we were previously at end position,
          // stay at end position to prevent oscillation at column bottom
          if (
            overColumnRef.current === targetColumn &&
            overIndexRef.current === tasksInColumn.length &&
            taskIndex === tasksInColumn.length - 1
          ) {
            // Keep the "append to end" position
            targetIndex = tasksInColumn.length;
          } else {
            targetIndex = taskIndex;
          }
        }
      }

      // Only track cross-column drags
      if (targetColumn && targetColumn === activeTask.status) {
        targetColumn = null;
        targetIndex = null;
      }

      // Update tracked task ID and state
      overTaskIdRef.current = overId;
      overColumnRef.current = targetColumn;
      overIndexRef.current = targetIndex;
      setOverColumn(targetColumn);
      setOverIndex(targetIndex);
    },
    [tasks, tasksByStatus]
  );

  const handleDragCancel = useCallback((_event: DragCancelEvent) => {
    setActiveId(null);
    setOverColumn(null);
    setOverIndex(null);
    overColumnRef.current = null;
    overIndexRef.current = null;
    overTaskIdRef.current = null;
  }, []);

  // Calculate item IDs for each column, including placeholder for cross-column drag
  const getColumnItemIds = useCallback(
    (columnId: TaskStatus): string[] => {
      const columnTasks = tasksByStatus[columnId];
      const baseIds = columnTasks.map((t) => t.id);

      // If dragging to this column from another column, insert the active ID
      if (activeId && overColumn === columnId && overIndex !== null) {
        const newIds = [...baseIds];
        newIds.splice(overIndex, 0, activeId);
        return newIds;
      }

      return baseIds;
    },
    [tasksByStatus, activeId, overColumn, overIndex]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragCancel={handleDragCancel}
    >
      <div className={cn('flex gap-4 overflow-x-auto pb-4 h-full', className)}>
        {columnConfig.map((col) => {
          const columnTasks = tasksByStatus[col.id];
          const itemIds = getColumnItemIds(col.id);
          const isDropTarget = overColumn === col.id && activeId;

          return (
            <div key={col.id} className="w-72 flex-shrink-0 h-full">
              <KanbanColumn
                id={col.id}
                title={col.title}
                count={columnTasks.length}
                itemIds={itemIds}
              >
                {itemIds.map((id) => {
                  // Render placeholder for the dragged item in destination column
                  if (isDropTarget && id === activeId) {
                    return (
                      <SortablePlaceholder
                        key={`placeholder-${id}`}
                        id={id}
                        height={80}
                      />
                    );
                  }
                  // Render actual task
                  const task = columnTasks.find((t) => t.id === id);
                  if (!task) return null;
                  return (
                    <SortableTask
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick?.(task.id)}
                    />
                  );
                })}
              </KanbanColumn>
            </div>
          );
        })}
      </div>

      <DragOverlay dropAnimation={null} className="z-[9999]">
        {activeTask && (
          <div className="w-72">
            <TaskCard
              id={activeTask.id}
              title={activeTask.title}
              description={activeTask.description}
              priority={activeTask.priority}
              artifactCount={activeTask.artifactCount}
              className="shadow-lg ring-2 ring-primary/20"
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

KanbanBoard.displayName = 'KanbanBoard';
