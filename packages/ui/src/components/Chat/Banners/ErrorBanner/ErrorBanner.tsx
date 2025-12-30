import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../Button';

/**
 * ErrorBanner - Inline dismissible error notification
 *
 * Use this for runtime errors that occur during conversation
 * (e.g., API errors, network issues). Supports dismiss and retry actions.
 *
 * For full-container error states, use ErrorState instead.
 */
export interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  sticky?: boolean;
}

// Close icon
const CloseIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// Alert icon
const AlertIcon = () => (
  <svg
    className="h-4 w-4 flex-shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

export const ErrorBanner = forwardRef<HTMLDivElement, ErrorBannerProps>(
  ({ message, onDismiss, onRetry, sticky = true }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg',
          'bg-destructive/10 border border-destructive/20',
          'text-destructive text-sm',
          'animate-slide-down',
          sticky && 'sticky top-0 z-10'
        )}
      >
        <AlertIcon />

        <div className="flex-1 min-w-0">
          <p className="font-medium">Error</p>
          <p className="text-destructive/80 mt-0.5">{message}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 rounded hover:bg-destructive/10 transition-colors"
              aria-label="Dismiss error"
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </div>
    );
  }
);

ErrorBanner.displayName = 'ErrorBanner';
