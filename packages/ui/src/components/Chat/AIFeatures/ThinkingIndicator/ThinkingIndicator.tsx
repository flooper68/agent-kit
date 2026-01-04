import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';

export interface ThinkingIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  status?: string;
  detail?: string;
  variant?: 'dots' | 'text' | 'spinner';
}

const ThinkingDots = () => (
  <div className="flex items-center gap-0.5">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot"
        style={{ animationDelay: `${i * 0.2}s` }}
      />
    ))}
  </div>
);

const ThinkingSpinner = () => (
  <svg
    className="h-4 w-4 animate-spin text-muted-foreground"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      fill="none"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

export const ThinkingIndicator = forwardRef<
  HTMLDivElement,
  ThinkingIndicatorProps
>(
  (
    { status = 'Thinking', detail, variant = 'dots', className, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-2 text-xs text-muted-foreground animate-fade-in',
          className
        )}
        {...props}
      >
        {variant === 'dots' && <ThinkingDots />}
        {variant === 'spinner' && <ThinkingSpinner />}
        {variant === 'text' && (
          <span className="animate-pulse">{status}...</span>
        )}
        {variant !== 'text' && (
          <div className="flex flex-col">
            <span className="font-medium">{status}</span>
            {detail && <span className="text-xs opacity-75">{detail}</span>}
          </div>
        )}
      </div>
    );
  }
);

ThinkingIndicator.displayName = 'ThinkingIndicator';
