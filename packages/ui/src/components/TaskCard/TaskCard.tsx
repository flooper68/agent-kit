import { Paperclip, GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PriorityBadge, type Priority } from '../PriorityBadge';

export interface TaskCardProps {
  id: string;
  title: string;
  description?: string | null;
  priority: Priority;
  artifactCount?: number;
  onClick?: () => void;
  isDragging?: boolean;
  showDragHandle?: boolean;
  className?: string;
}

export function TaskCard({
  title,
  description,
  priority,
  artifactCount = 0,
  onClick,
  isDragging = false,
  showDragHandle = false,
  className,
}: TaskCardProps) {
  return (
    <div
      className={cn(
        'group rounded-lg border border-border bg-card p-3',
        onClick && 'cursor-pointer hover:border-primary/50',
        isDragging && 'opacity-50',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="flex items-start gap-2">
        {showDragHandle && (
          <div className="mt-0.5 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground line-clamp-2">
            {title}
          </p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <PriorityBadge priority={priority} />
        {artifactCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Paperclip className="h-3 w-3" />
            {artifactCount > 5 ? '5+' : artifactCount}
          </span>
        )}
      </div>
    </div>
  );
}

TaskCard.displayName = 'TaskCard';
