import { X } from 'lucide-react';
import { Dialog } from '../../../Dialog';
import { TaskHistoryItemComponent } from './TaskHistoryItem';
import type { TaskHistoryItem } from '../../../../types/chat';

export interface TaskHistorySidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: TaskHistoryItem[];
  selectedTaskId?: string;
  onTaskSelect?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
}

export function TaskHistorySidebar({
  open,
  onOpenChange,
  tasks,
  selectedTaskId,
  onTaskSelect,
  onTaskDelete,
}: TaskHistorySidebarProps) {
  const handleTaskSelect = (taskId: string) => {
    onTaskSelect?.(taskId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content position="left" size="md" showOverlay className="p-3">
        <div className="flex flex-col h-full gap-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Task History</h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

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
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
