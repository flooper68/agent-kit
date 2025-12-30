import { forwardRef } from 'react';
import { cn } from '../../../lib/utils';
import { Collapsible } from '../../Collapsible';
import type { ToolInvocationPart, ToolResultPart } from '../../../types/chat';

export interface ToolCallDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  invocation: ToolInvocationPart;
  result?: ToolResultPart;
  defaultExpanded?: boolean;
}

const stateColors = {
  pending: 'text-muted-foreground',
  running: 'text-blue-500',
  completed: 'text-green-500',
  error: 'text-destructive',
};

const stateLabels = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  error: 'Error',
};

export const ToolCallDisplay = forwardRef<HTMLDivElement, ToolCallDisplayProps>(
  (
    { invocation, result, defaultExpanded = false, className, ...props },
    ref
  ) => {
    const { toolName, args, state } = invocation;

    return (
      <Collapsible defaultOpen={defaultExpanded}>
        <div
          ref={ref}
          className={cn(
            'rounded-lg border bg-muted/30 text-sm overflow-hidden',
            className
          )}
          {...props}
        >
          <Collapsible.Trigger className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="font-mono font-medium">{toolName}</span>
              <span className={cn('text-xs', stateColors[state])}>
                {stateLabels[state]}
              </span>
            </div>
            <svg
              className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </Collapsible.Trigger>

          <Collapsible.Content>
            <div className="px-3 py-2 border-t space-y-2">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Input
                </div>
                <pre className="text-xs bg-background rounded p-2 overflow-x-auto">
                  {JSON.stringify(args, null, 2)}
                </pre>
              </div>
              {result && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {result.isError ? 'Error' : 'Output'}
                  </div>
                  <pre
                    className={cn(
                      'text-xs rounded p-2 overflow-x-auto',
                      result.isError
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-background'
                    )}
                  >
                    {typeof result.result === 'string'
                      ? result.result
                      : JSON.stringify(result.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </Collapsible.Content>
        </div>
      </Collapsible>
    );
  }
);

ToolCallDisplay.displayName = 'ToolCallDisplay';
