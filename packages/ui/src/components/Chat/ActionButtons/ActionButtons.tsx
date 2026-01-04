import { forwardRef } from 'react';
import { cn } from '../../../lib/utils';
import { IconButton } from '../../IconButton';

export interface RetryButtonProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  onRetry?: () => void;
}

export const RetryButton = forwardRef<HTMLButtonElement, RetryButtonProps>(
  ({ onRetry, className, ...props }, ref) => {
    return (
      <IconButton
        ref={ref}
        icon={
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        }
        label="Retry"
        onClick={onRetry}
        className={cn(className)}
        {...props}
      />
    );
  }
);

RetryButton.displayName = 'RetryButton';

export interface RegenerateButtonProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  onRegenerate?: () => void;
}

export const RegenerateButton = forwardRef<
  HTMLButtonElement,
  RegenerateButtonProps
>(({ onRegenerate, className, ...props }, ref) => {
  return (
    <IconButton
      ref={ref}
      icon={
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      }
      label="Regenerate response"
      onClick={onRegenerate}
      className={cn(className)}
      {...props}
    />
  );
});

RegenerateButton.displayName = 'RegenerateButton';
