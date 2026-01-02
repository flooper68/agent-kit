import { forwardRef, memo, useState, useEffect, useCallback } from 'react';
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
        placeholder = 'Select agent',
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
        <div ref={ref} className={cn('relative', className)} {...props}>
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-2 px-2 py-1 text-sm rounded-md hover:bg-accent transition-colors',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {selectedAgent?.icon && (
              <span className="text-muted-foreground flex-shrink-0 [&>svg]:h-4 [&>svg]:w-4">
                {selectedAgent.icon}
              </span>
            )}
            <span className="font-medium">
              {selectedAgent?.name ?? placeholder}
            </span>
            <svg
              className={cn(
                'h-4 w-4 transition-transform',
                isOpen && 'rotate-180'
              )}
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
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute bottom-full left-0 mb-1 w-64 z-20 rounded-md border bg-popover shadow-md">
                {agents.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No agents available
                  </div>
                ) : (
                  agents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => handleSelect(agent)}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors',
                        agent.id === selectedAgent?.id && 'bg-accent'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {agent.icon && (
                          <span className="text-muted-foreground flex-shrink-0 [&>svg]:h-4 [&>svg]:w-4">
                            {agent.icon}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{agent.name}</div>
                          {agent.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {agent.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      );
    }
  )
);

AgentSelector.displayName = 'AgentSelector';
