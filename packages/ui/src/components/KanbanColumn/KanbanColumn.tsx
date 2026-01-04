import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '../../lib/utils';

export interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
  itemIds: string[];
  className?: string;
}

const columnColors: Record<string, string> = {
  todo: 'border-t-gray-400',
  in_progress: 'border-t-blue-500',
  review: 'border-t-purple-500',
  done: 'border-t-green-500',
};

export function KanbanColumn({
  id,
  title,
  count,
  children,
  itemIds,
  className,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-lg bg-muted/30 border-t-2 h-full',
        columnColors[id] || 'border-t-gray-400',
        className
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <h3 className="font-medium text-sm">{title}</h3>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {count}
        </span>
      </div>
      <div className="flex-1 p-2 overflow-y-auto">
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">{children}</div>
        </SortableContext>
        {count === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

KanbanColumn.displayName = 'KanbanColumn';
