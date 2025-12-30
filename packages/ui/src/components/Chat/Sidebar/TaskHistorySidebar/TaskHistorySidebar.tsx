import { forwardRef } from 'react';
import { Dialog } from '../../../Dialog';
import { Button } from '../../../Button';
import { TaskHistoryItemComponent } from './TaskHistoryItem';
import type { TaskHistoryItem } from '../../../../types/chat';

export interface TaskHistorySidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: TaskHistoryItem[];
  selectedTaskId?: string;
  onTaskSelect?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onNewTask?: () => void;
}

// Plus icon for new task
const PlusIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

// Close icon
const CloseIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export const TaskHistorySidebar = forwardRef<
  HTMLDivElement,
  TaskHistorySidebarProps
>(
  (
    {
      open,
      onOpenChange,
      tasks,
      selectedTaskId,
      onTaskSelect,
      onTaskDelete,
      onNewTask,
    },
    _ref
  ) => {
    const handleTaskSelect = (taskId: string) => {
      onTaskSelect?.(taskId);
      onOpenChange(false);
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <Dialog.Content position="left" size="md" showOverlay>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-semibold">Task History</h2>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
                aria-label="Close sidebar"
              >
                <CloseIcon />
              </button>
            </div>

            {/* New Task Button */}
            {onNewTask && (
              <div className="px-4 pb-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    onNewTask();
                    onOpenChange(false);
                  }}
                >
                  <PlusIcon />
                  New Task
                </Button>
              </div>
            )}

            {/* Task List */}
            <div className="flex-1 overflow-y-auto p-2">
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
                <div className="space-y-1">
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
          </div>
        </Dialog.Content>
      </Dialog>
    );
  }
);

TaskHistorySidebar.displayName = 'TaskHistorySidebar';
