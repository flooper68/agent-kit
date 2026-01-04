import { Calendar, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DueDateIndicatorProps {
  dueDate?: Date | null;
  completedAt?: Date | null;
  className?: string;
}

function formatDueDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const targetDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const diffDays = Math.floor(
    (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return `${Math.abs(diffDays)}d overdue`;
  }
  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Tomorrow';
  }
  if (diffDays <= 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDueDateStatus(
  dueDate: Date,
  completedAt?: Date | null
): 'overdue' | 'today' | 'soon' | 'normal' {
  if (completedAt) return 'normal';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate()
  );

  const diffDays = Math.floor(
    (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 3) return 'soon';
  return 'normal';
}

const statusColors = {
  overdue: 'text-red-600 dark:text-red-400',
  today: 'text-orange-600 dark:text-orange-400',
  soon: 'text-yellow-600 dark:text-yellow-400',
  normal: 'text-muted-foreground',
};

export function DueDateIndicator({
  dueDate,
  completedAt,
  className,
}: DueDateIndicatorProps) {
  if (!dueDate) {
    return null;
  }

  const status = getDueDateStatus(dueDate, completedAt);
  const formattedDate = formatDueDate(dueDate);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs',
        statusColors[status],
        className
      )}
    >
      {status === 'overdue' ? (
        <AlertCircle className="h-3 w-3" />
      ) : (
        <Calendar className="h-3 w-3" />
      )}
      {formattedDate}
    </span>
  );
}

DueDateIndicator.displayName = 'DueDateIndicator';
