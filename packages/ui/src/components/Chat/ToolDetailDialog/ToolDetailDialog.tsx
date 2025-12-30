import { forwardRef } from 'react';
import { cn } from '../../../lib/utils';
import { Dialog } from '../../Dialog';
import { ToolBadge } from '../ToolBadge';
import { Button } from '../../Button';
import type { ToolInvocationPart, ToolResultPart } from '../../../types/chat';

export interface ToolDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invocation: ToolInvocationPart;
  result?: ToolResultPart;
}

// Result display component
const ResultDisplay = ({
  result,
  isError,
}: {
  result: unknown;
  isError: boolean;
}) => {
  // Handle string results
  if (typeof result === 'string') {
    return (
      <pre
        className={cn(
          'text-xs p-3 rounded-md overflow-x-auto whitespace-pre-wrap break-words',
          isError ? 'bg-destructive/10 text-destructive' : 'bg-muted'
        )}
      >
        {result}
      </pre>
    );
  }

  // Handle object/array results
  const formatted = JSON.stringify(result, null, 2);
  return (
    <pre
      className={cn(
        'text-xs p-3 rounded-md overflow-x-auto',
        isError ? 'bg-destructive/10 text-destructive' : 'bg-muted'
      )}
    >
      {formatted}
    </pre>
  );
};

export const ToolDetailDialog = forwardRef<
  HTMLDivElement,
  ToolDetailDialogProps
>(({ open, onOpenChange, invocation, result }, _ref) => {
  const { toolName, args, state } = invocation;
  const isError = state === 'error' || result?.isError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content size="lg">
        <Dialog.Header>
          <Dialog.Title>
            <div className="flex items-center gap-3">
              <span>Tool Execution</span>
              <ToolBadge toolName={toolName} state={state} />
            </div>
          </Dialog.Title>
          <Dialog.Description>
            Details of the tool invocation and its result
          </Dialog.Description>
        </Dialog.Header>

        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Input Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Input</h4>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>

          {/* Output Section */}
          {result && (
            <div className="space-y-2">
              <h4
                className={cn(
                  'text-sm font-medium',
                  isError ? 'text-destructive' : 'text-foreground'
                )}
              >
                {isError ? 'Error' : 'Output'}
              </h4>
              <ResultDisplay
                result={result.result}
                isError={isError ?? false}
              />
            </div>
          )}

          {/* No result yet */}
          {!result && state !== 'completed' && (
            <div className="text-sm text-muted-foreground italic">
              {state === 'running'
                ? 'Tool is currently executing...'
                : 'Waiting for execution...'}
            </div>
          )}
        </div>

        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button variant="outline">Close</Button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
});

ToolDetailDialog.displayName = 'ToolDetailDialog';
