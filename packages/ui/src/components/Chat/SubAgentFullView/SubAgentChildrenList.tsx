import { memo } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../../lib/utils';
import { Button } from '../../Button';

export type ChildSessionStatus = 'active' | 'complete' | 'error';

export interface ChildSession {
  sessionId: string;
  title: string;
  agentName: string;
  status: ChildSessionStatus;
}

export interface SubAgentChildrenListProps {
  /** List of child sessions */
  sessions: ChildSession[];
  /** Callback when opening a child session */
  onOpenChild: (sessionId: string) => void;
}

const statusIconVariants = cva('h-3 w-3', {
  variants: {
    status: {
      active: 'text-info animate-spin',
      complete: 'text-success',
      error: 'text-destructive',
    },
  },
  defaultVariants: {
    status: 'active',
  },
});

// Status icons
const StatusIcon = ({ status }: { status: ChildSessionStatus }) => {
  switch (status) {
    case 'active':
      return (
        <svg
          className={cn(statusIconVariants({ status }))}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeOpacity="0.25"
          />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    case 'complete':
      return (
        <svg
          className={cn(statusIconVariants({ status }))}
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      );
    case 'error':
      return (
        <svg
          className={cn(statusIconVariants({ status }))}
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      );
  }
};

/**
 * Custom comparison function for memoization
 */
function areSubAgentChildrenListPropsEqual(
  prev: SubAgentChildrenListProps,
  next: SubAgentChildrenListProps
): boolean {
  if (prev.onOpenChild !== next.onOpenChild) return false;
  if (prev.sessions.length !== next.sessions.length) return false;

  for (let i = 0; i < prev.sessions.length; i++) {
    const prevChild = prev.sessions[i];
    const nextChild = next.sessions[i];
    if (prevChild?.sessionId !== nextChild?.sessionId) return false;
    if (prevChild?.status !== nextChild?.status) return false;
    if (prevChild?.agentName !== nextChild?.agentName) return false;
  }

  return true;
}

export const SubAgentChildrenList = memo(function SubAgentChildrenList({
  sessions,
  onOpenChild,
}: SubAgentChildrenListProps) {
  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="py-3 border-t border-border">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-muted-foreground">Child agents:</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {sessions.map((child) => (
          <div
            key={child.sessionId}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md',
              'bg-muted/50 border border-border',
              'text-sm whitespace-nowrap'
            )}
          >
            <StatusIcon status={child.status} />
            <span className="font-medium">{child.agentName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChild(child.sessionId)}
              className="h-6 px-2 text-xs"
            >
              Open
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}, areSubAgentChildrenListPropsEqual);
