import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

type ToolState = 'pending' | 'running' | 'completed' | 'error';

const toolBadgeVariants = cva(
  [
    'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
    'transition-colors',
  ],
  {
    variants: {
      state: {
        pending: 'bg-muted text-muted-foreground',
        running: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        completed: 'bg-green-500/10 text-green-600 dark:text-green-400',
        error: 'bg-destructive/10 text-destructive',
      },
      interactive: {
        true: 'cursor-pointer hover:opacity-80',
        false: '',
      },
    },
    defaultVariants: {
      state: 'pending',
      interactive: false,
    },
  }
);

// State icons as inline SVGs
const StateIcon = ({ state }: { state: ToolState }) => {
  switch (state) {
    case 'pending':
      return (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        </svg>
      );
    case 'running':
      return (
        <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
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
    case 'completed':
      return (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24">
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
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24">
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

// Tool icon
const ToolIcon = () => (
  <svg
    className="h-3 w-3 opacity-70"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

export interface ToolBadgeProps extends Omit<
  VariantProps<typeof toolBadgeVariants>,
  'interactive'
> {
  toolName: string;
  state: ToolState;
  onClick?: () => void;
}

export const ToolBadge = forwardRef<HTMLButtonElement, ToolBadgeProps>(
  ({ toolName, state, onClick }, ref) => {
    const isInteractive = !!onClick;

    const content = (
      <>
        <ToolIcon />
        <span className="font-mono truncate max-w-[120px]">{toolName}</span>
        <StateIcon state={state} />
      </>
    );

    if (isInteractive) {
      return (
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          className={cn(toolBadgeVariants({ state, interactive: true }))}
        >
          {content}
        </button>
      );
    }

    return (
      <span className={cn(toolBadgeVariants({ state, interactive: false }))}>
        {content}
      </span>
    );
  }
);

ToolBadge.displayName = 'ToolBadge';
