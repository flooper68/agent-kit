import { memo } from 'react';
import { X, Bot, Cpu, Wrench } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { AgentType } from '../../../../types/chat';
import { Dialog } from '../../../Dialog';

export interface AgentInfoDialogProps {
  /** The agent to display info for */
  agent: AgentType;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
}

export const AgentInfoDialog = memo(
  ({ agent, open, onOpenChange }: AgentInfoDialogProps) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <Dialog.Content size="sm" showOverlay>
          <div className="p-3">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-2">
                <div
                  className={cn(
                    'flex items-center justify-center w-5 h-5 mt-0.5 flex-shrink-0',
                    'text-muted-foreground'
                  )}
                >
                  {agent.icon || <Bot className="h-4 w-4" />}
                </div>
                <div>
                  <Dialog.Title className="text-base font-semibold tracking-tight">
                    {agent.name}
                  </Dialog.Title>
                  {agent.description && (
                    <Dialog.Description className="text-sm text-muted-foreground mt-0.5 max-w-[280px]">
                      {agent.description}
                    </Dialog.Description>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className={cn(
                  'p-1 rounded-lg hover:bg-muted transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                )}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Info sections */}
            <div className="space-y-2">
              {/* Model info */}
              {(agent.model || agent.provider) && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                  <Cpu className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Model
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {agent.model || 'Default'}
                      {agent.provider && (
                        <span className="text-muted-foreground font-normal">
                          {' '}
                          by {agent.provider}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Tools */}
              {agent.tools && agent.tools.length > 0 && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                  <Wrench className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Available Tools
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {agent.tools.map((tool) => (
                        <span
                          key={tool}
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
                            'bg-background border border-border text-foreground'
                          )}
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog>
    );
  }
);

AgentInfoDialog.displayName = 'AgentInfoDialog';
