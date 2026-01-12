import { FileText, Folder } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TaskCounts {
  backlog: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
  total: number;
}

export interface ProjectCardProps {
  title: string;
  summary?: string | null;
  taskCounts: TaskCounts;
  documentCount?: number;
  onClick?: () => void;
  className?: string;
}

export function ProjectCard({
  title,
  summary,
  taskCounts,
  documentCount,
  onClick,
  className,
}: ProjectCardProps) {
  const completionPercent =
    taskCounts.total > 0
      ? Math.round((taskCounts.done / taskCounts.total) * 100)
      : 0;

  return (
    <div
      className={cn(
        'group rounded-lg border border-border bg-card p-4 transition-colors',
        onClick && 'cursor-pointer hover:border-primary/50 hover:bg-accent/50',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-primary/10 p-2 text-primary">
          <Folder className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground line-clamp-2">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {summary || '\u00A0'}
          </p>
          {documentCount !== undefined && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span>
                {documentCount} {documentCount === 1 ? 'document' : 'documents'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        {/* Task counts */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              {taskCounts.backlog}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
              {taskCounts.todo}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              {taskCounts.inProgress}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              {taskCounts.review}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {taskCounts.done}
            </span>
          </div>
          <span>{completionPercent}% complete</span>
        </div>
      </div>
    </div>
  );
}

ProjectCard.displayName = 'ProjectCard';
