import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../Button';
import { Select } from '../Select';
import type { Priority } from '../PriorityBadge';
import type { TaskStatus } from '../StatusBadge';

export interface TaskFiltersState {
  priority?: Priority;
  status?: TaskStatus;
  hasArtifacts?: boolean;
  searchQuery?: string;
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
    filters.priority || filters.status || filters.hasArtifacts || filters.searchQuery;

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      searchQuery: value || undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 py-1 -my-1',
        className
      )}
    >
      {/* Search input */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.searchQuery ?? ''}
          onChange={handleSearchChange}
          className={cn(
            'h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
          )}
        />
      </div>

      {/* Spacer to push filters to right */}
      <div className="flex-1" />

      {/* Filters - aligned to right */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Clear filters - on the left of filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 text-xs"
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
          className="h-8 w-32 text-xs"
        />

        {/* Status filter (optional) */}
        {showStatus && (
          <Select
            options={statusOptions}
            value={filters.status ?? 'all'}
            onValueChange={handleStatusChange}
            className="h-8 w-32 text-xs"
          />
        )}

        {/* Toggle filters */}
        <button
          onClick={toggleHasArtifacts}
          className={cn(
            'h-8 rounded-md px-3 text-xs font-medium transition-colors border whitespace-nowrap',
            filters.hasArtifacts
              ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800'
              : 'bg-background text-muted-foreground border-input hover:bg-muted'
          )}
        >
          Has attachments
        </button>
      </div>
    </div>
  );
}

TaskFilters.displayName = 'TaskFilters';
