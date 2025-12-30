import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../lib/utils';
import type { ContextUsage } from '../../../../types/chat';

const bannerVariants = cva(
  ['flex items-start gap-3 p-3 rounded-lg', 'text-sm animate-slide-down'],
  {
    variants: {
      variant: {
        warning:
          'bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400',
        error:
          'bg-destructive/10 border border-destructive/20 text-destructive',
      },
    },
    defaultVariants: {
      variant: 'warning',
    },
  }
);

export interface TokenLimitBannerProps extends VariantProps<
  typeof bannerVariants
> {
  usage: ContextUsage;
  warningThreshold?: number;
  onDismiss?: () => void;
}

// Warning icon
const WarningIcon = () => (
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

const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
};

export const TokenLimitBanner = forwardRef<
  HTMLDivElement,
  TokenLimitBannerProps
>(({ usage, warningThreshold = 90, variant, onDismiss }, ref) => {
  const isAtLimit = usage.percentage >= 100;

  // Auto-determine variant if not provided
  const resolvedVariant = variant ?? (isAtLimit ? 'error' : 'warning');

  // Don't render if not at warning threshold
  if (usage.percentage < warningThreshold) {
    return null;
  }

  const message = isAtLimit
    ? 'Context limit reached. Start a new conversation to continue.'
    : `Approaching context limit (${Math.round(usage.percentage)}% used).`;

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(bannerVariants({ variant: resolvedVariant }))}
    >
      <WarningIcon />

      <div className="flex-1 min-w-0">
        <p className="font-medium">
          {isAtLimit ? 'Context Limit Reached' : 'Context Warning'}
        </p>
        <p className="opacity-80 mt-0.5">{message}</p>
        <p className="text-xs opacity-60 mt-1">
          {formatTokens(usage.used)} / {formatTokens(usage.total)} tokens
        </p>
      </div>

      {onDismiss && !isAtLimit && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded hover:opacity-70 transition-opacity flex-shrink-0"
          aria-label="Dismiss warning"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
});

TokenLimitBanner.displayName = 'TokenLimitBanner';
