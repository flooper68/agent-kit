import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../Button';
import { Select } from '../Select';
import type { Priority } from '../PriorityBadge';
import type { TaskStatus } from '../StatusBadge';

export interface TaskFiltersState {
  priority?: Priority;
  status?: TaskStatus;
  hasArtifacts?: boolean;
}

export interface TaskFiltersProps {
  filters: TaskFiltersState;
  onFiltersChange: (filters: TaskFiltersState) => void;
  showStatus?: boolean;
  className?: string;
}

const priorityOptions = [
  { value: 'all', label: 'All priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

export function TaskFilters({
  filters,
  onFiltersChange,
  showStatus = false,
  className,
}: TaskFiltersProps) {
  const hasActiveFilters =
    filters.priority || filters.status || filters.hasArtifacts;

  const handlePriorityChange = (value: string) => {
    onFiltersChange({
      ...filters,
      priority: value === 'all' ? undefined : (value as Priority),
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === 'all' ? undefined : (value as TaskStatus),
    });
  };

  const toggleHasArtifacts = () => {
    onFiltersChange({
      ...filters,
      hasArtifacts: filters.hasArtifacts ? undefined : true,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 overflow-x-auto py-1 -my-1',
        className
      )}
    >
      {/* Clear filters - shown first when active */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 px-2 text-xs flex-shrink-0"
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      )}

      {/* Priority filter */}
      <Select
        options={priorityOptions}
        value={filters.priority ?? 'all'}
        onValueChange={handlePriorityChange}
        className="h-8 w-32 text-xs flex-shrink-0"
      />

      {/* Status filter (optional) */}
      {showStatus && (
        <Select
          options={statusOptions}
          value={filters.status ?? 'all'}
          onValueChange={handleStatusChange}
          className="h-8 w-32 text-xs flex-shrink-0"
        />
      )}

      {/* Toggle filters */}
      <button
        onClick={toggleHasArtifacts}
        className={cn(
          'h-8 rounded-md px-3 text-xs font-medium transition-colors border whitespace-nowrap flex-shrink-0',
          filters.hasArtifacts
            ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800'
            : 'bg-background text-muted-foreground border-input hover:bg-muted'
        )}
      >
        Has attachments
      </button>
    </div>
  );
}

TaskFilters.displayName = 'TaskFilters';
