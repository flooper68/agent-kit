import { X, User, Globe, Bot, Clock } from 'lucide-react';
import { Dialog } from '../../../Dialog';
import { ToggleGroup } from '../../../ToggleGroup';
import { Pagination } from '../../../Pagination';
import { Tooltip } from '../../../Tooltip';
import { TaskHistoryItemComponent } from './TaskHistoryItem';
import { type SessionFilter } from '../SessionFilterDropdown';
import type { TaskHistoryItem } from '../../../../types/chat';

export interface TaskHistorySidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: TaskHistoryItem[];
  selectedTaskId?: string;
  onTaskSelect?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  /** Current filter value */
  filter?: SessionFilter;
  /** Callback when filter changes */
  onFilterChange?: (filter: SessionFilter) => void;
  /** Whether there is a next page of results */
  hasNextPage?: boolean;
  /** Whether there is a previous page of results */
  hasPreviousPage?: boolean;
  /** Callback when user navigates to next page */
  onNextPage?: () => void;
  /** Callback when user navigates to previous page */
  onPreviousPage?: () => void;
  /** Whether pagination is loading */
  isPaginationLoading?: boolean;
  /** Total count of sessions for current filter */
  totalCount?: number;
}

export function TaskHistorySidebar({
  open,
  onOpenChange,
  tasks,
  selectedTaskId,
  onTaskSelect,
  onTaskDelete,
  filter = 'my_chats',
  onFilterChange,
  hasNextPage,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
  isPaginationLoading,
  totalCount,
}: TaskHistorySidebarProps) {
  const handleTaskSelect = (taskId: string) => {
    onTaskSelect?.(taskId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content position="left" size="half" showOverlay className="p-3">
        <div className="flex flex-col h-full gap-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dialog.Title className="text-lg font-semibold">
                Task History
              </Dialog.Title>
              {totalCount !== undefined && (
                <span className="text-sm text-muted-foreground">
                  ({totalCount})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Filter */}
          {onFilterChange && (
            <div className="flex">
              <ToggleGroup
                type="single"
                value={filter}
                onValueChange={(value) =>
                  onFilterChange(value as SessionFilter)
                }
                size="sm"
              >
                <Tooltip content="My Chats">
                  <ToggleGroup.Item value="my_chats" aria-label="My Chats">
                    <User className="h-4 w-4" />
                  </ToggleGroup.Item>
                </Tooltip>
                <Tooltip content="All Sessions">
                  <ToggleGroup.Item value="all" aria-label="All Sessions">
                    <Globe className="h-4 w-4" />
                  </ToggleGroup.Item>
                </Tooltip>
                <Tooltip content="Sub-agents Only">
                  <ToggleGroup.Item
                    value="sub_agents"
                    aria-label="Sub-agents Only"
                  >
                    <Bot className="h-4 w-4" />
                  </ToggleGroup.Item>
                </Tooltip>
                <Tooltip content="Scheduled">
                  <ToggleGroup.Item value="scheduled" aria-label="Scheduled">
                    <Clock className="h-4 w-4" />
                  </ToggleGroup.Item>
                </Tooltip>
              </ToggleGroup>
            </div>
          )}

          {/* Task List */}
          <div className="flex-1 overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No task history yet.
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Start a new task to see it here.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {tasks.map((task) => (
                  <TaskHistoryItemComponent
                    key={task.id}
                    task={task}
                    isSelected={task.id === selectedTaskId}
                    onSelect={() => handleTaskSelect(task.id)}
                    onDelete={
                      onTaskDelete ? () => onTaskDelete(task.id) : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {(hasNextPage || hasPreviousPage) && onNextPage && onPreviousPage && (
            <Pagination
              hasNextPage={hasNextPage ?? false}
              hasPreviousPage={hasPreviousPage ?? false}
              onNextPage={onNextPage}
              onPreviousPage={onPreviousPage}
              isLoading={isPaginationLoading}
            />
          )}
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
