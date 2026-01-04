import { cva, type VariantProps } from 'class-variance-authority';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      status: {
        backlog:
          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        todo: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        in_progress:
          'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
        review:
          'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
        done: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
      },
    },
    defaultVariants: {
      status: 'todo',
    },
  }
);

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export interface StatusBadgeProps
  extends VariantProps<typeof statusBadgeVariants> {
  status: TaskStatus;
  showIcon?: boolean;
  className?: string;
}

const statusLabels: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export function StatusBadge({
  status,
  showIcon = true,
  className,
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      {status === 'done' && showIcon && <Check className="h-3 w-3" />}
      {statusLabels[status]}
    </span>
  );
}

StatusBadge.displayName = 'StatusBadge';
