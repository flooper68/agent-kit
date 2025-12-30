import { forwardRef, memo, useState, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { AgentType } from '../../../../types/chat';

export interface AgentSelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** List of available agents to select from */
  agents: AgentType[];
  /** Currently selected agent */
  selectedAgent?: AgentType;
  /** Callback when an agent is selected */
  onSelect?: (agent: AgentType) => void;
  /** Placeholder text when no agent is selected */
  placeholder?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

export const AgentSelector = memo(
  forwardRef<HTMLDivElement, AgentSelectorProps>(
    (
      {
        agents,
        selectedAgent,
        onSelect,
        placeholder = 'Select an agent...',
        disabled,
        className,
        ...props
      },
      ref
    ) => {
      const [isOpen, setIsOpen] = useState(false);

      const handleClose = useCallback(() => {
        setIsOpen(false);
      }, []);

      // Close dropdown on Escape key
      useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            handleClose();
          }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }, [isOpen, handleClose]);

      const handleSelect = (agent: AgentType) => {
        onSelect?.(agent);
        setIsOpen(false);
      };

      return (
        <div ref={ref} className={cn('relative w-full', className)} {...props}>
          {/* Trigger button */}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg border transition-colors',
              'bg-background hover:bg-accent/50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              disabled && 'opacity-50 cursor-not-allowed',
              isOpen && 'ring-2 ring-ring ring-offset-2'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              {selectedAgent?.icon && (
                <span className="text-muted-foreground flex-shrink-0 [&>svg]:h-4 [&>svg]:w-4">
                  {selectedAgent.icon}
                </span>
              )}
              <span
                className={cn(
                  'truncate',
                  !selectedAgent && 'text-muted-foreground'
                )}
              >
                {selectedAgent?.name ?? placeholder}
              </span>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />

              {/* Dropdown panel */}
              <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-lg border bg-popover shadow-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto py-1">
                  {agents.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                      No agents available
                    </div>
                  ) : (
                    agents.map((agent) => (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => handleSelect(agent)}
                        className={cn(
                          'w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center gap-3',
                          agent.id === selectedAgent?.id && 'bg-accent'
                        )}
                      >
                        {agent.icon && (
                          <span className="text-muted-foreground flex-shrink-0 [&>svg]:h-4 [&>svg]:w-4">
                            {agent.icon}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {agent.name}
                          </div>
                          {agent.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {agent.description}
                            </div>
                          )}
                        </div>
                        {agent.id === selectedAgent?.id && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      );
    }
  )
);

AgentSelector.displayName = 'AgentSelector';
