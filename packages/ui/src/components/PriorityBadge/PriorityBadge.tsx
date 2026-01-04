import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const priorityBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      priority: {
        low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        medium:
          'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
        high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
        urgent: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
      },
    },
    defaultVariants: {
      priority: 'medium',
    },
  }
);

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface PriorityBadgeProps
  extends VariantProps<typeof priorityBadgeVariants> {
  priority: Priority;
  className?: string;
}

const priorityLabels: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span className={cn(priorityBadgeVariants({ priority }), className)}>
      {priorityLabels[priority]}
    </span>
  );
}

PriorityBadge.displayName = 'PriorityBadge';
