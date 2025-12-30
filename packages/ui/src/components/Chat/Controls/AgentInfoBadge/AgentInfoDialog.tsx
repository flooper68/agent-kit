import { memo } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { AgentType } from '../../../../types/chat';
import { Dialog } from '../../../Dialog';
import { Heading, Text } from '../../../Typography';

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
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {agent.icon && (
                  <div
                    className={cn(
                      'flex items-center justify-center w-12 h-12 rounded-lg',
                      'bg-primary/10 text-primary'
                    )}
                  >
                    {agent.icon}
                  </div>
                )}
                <div>
                  <Heading size="20">{agent.name}</Heading>
                  <Text variant="muted" size="14">
                    AI Assistant
                  </Text>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className={cn(
                  'p-1 rounded hover:bg-muted transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                )}
                aria-label="Close dialog"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Description */}
            {agent.description && (
              <div className="mb-4">
                <Text variant="muted" size="14" className="font-medium mb-1">
                  About
                </Text>
                <Text size="14">{agent.description}</Text>
              </div>
            )}

            {/* Capabilities placeholder - for future use */}
            <div>
              <Text variant="muted" size="14" className="font-medium mb-2">
                Capabilities
              </Text>
              <ul className="space-y-1">
                <li className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Text generation and conversation</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Code assistance and debugging</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Task planning and execution</span>
                </li>
              </ul>
            </div>
          </div>
        </Dialog.Content>
      </Dialog>
    );
  }
);

AgentInfoDialog.displayName = 'AgentInfoDialog';
