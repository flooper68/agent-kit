import { forwardRef, memo, useState } from 'react';
import { cn } from '../../../../lib/utils';
import type { AgentType } from '../../../../types/chat';
import { AgentInfoDialog } from './AgentInfoDialog';

export interface AgentInfoBadgeProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** The agent to display */
  agent: AgentType;
}

export const AgentInfoBadge = memo(
  forwardRef<HTMLButtonElement, AgentInfoBadgeProps>(
    ({ agent, className, ...props }, ref) => {
      const [dialogOpen, setDialogOpen] = useState(false);

      return (
        <>
          <button
            ref={ref}
            type="button"
            onClick={() => setDialogOpen(true)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
              'bg-muted/50 hover:bg-muted transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              className
            )}
            aria-label={`${agent.name} - click for details`}
            {...props}
          >
            {agent.icon && (
              <span className="text-muted-foreground [&>svg]:h-3 [&>svg]:w-3">
                {agent.icon}
              </span>
            )}
            <span className="font-medium text-muted-foreground">
              {agent.name}
            </span>
          </button>

          <AgentInfoDialog
            agent={agent}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
          />
        </>
      );
    }
  )
);

AgentInfoBadge.displayName = 'AgentInfoBadge';
