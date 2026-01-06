import { forwardRef, memo } from 'react';
import { Circle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { TodoItem } from '../../../types/chat';

export interface TodosFloatingPanelProps {
  /** List of todos to display */
  todos: TodoItem[];
  /** Additional class names */
  className?: string;
}

/**
 * Floating panel that displays todos from TodoWrite tool executions.
 * Shows read-only checkboxes reflecting the agent's todo state.
 */
export const TodosFloatingPanel = memo(
  forwardRef<HTMLDivElement, TodosFloatingPanelProps>(
    ({ todos, className }, ref) => {
      // Don't render if no todos
      if (!todos || todos.length === 0) {
        return null;
      }

      return (
        <div
          ref={ref}
          className={cn(
            'rounded-lg border border-border bg-background/95 backdrop-blur-sm shadow-sm',
            'animate-in fade-in-0 slide-in-from-bottom-2 duration-200',
            'max-h-48 overflow-y-auto',
            className
          )}
        >
          <ul className="p-3 space-y-1.5">
            {todos.map((todo, index) => (
              <TodoItemRow key={`${todo.content}-${index}`} todo={todo} />
            ))}
          </ul>
        </div>
      );
    }
  )
);

TodosFloatingPanel.displayName = 'TodosFloatingPanel';

interface TodoItemRowProps {
  todo: TodoItem;
}

const TodoItemRow = memo(({ todo }: TodoItemRowProps) => {
  const isCompleted = todo.status === 'completed';
  const isInProgress = todo.status === 'in_progress';

  return (
    <li className="flex items-start gap-2 text-sm">
      <span className="flex-shrink-0 mt-0.5">
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : isInProgress ? (
          <Loader2 className="h-4 w-4 text-info animate-spin" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
      </span>
      <span
        className={cn(
          'flex-1',
          isCompleted && 'line-through text-muted-foreground opacity-60'
        )}
      >
        {isInProgress ? todo.activeForm : todo.content}
      </span>
    </li>
  );
});

TodoItemRow.displayName = 'TodoItemRow';
