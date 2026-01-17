import { memo } from 'react';
import { cn } from '../../../../lib/utils';
import { Tooltip } from '../../../Tooltip';

export interface ChipInlineDisplayProps {
  /** The slash command key (e.g., "summarize") */
  commandKey: string;
  /** Optional: command title for tooltip */
  title?: string;
  /** Optional: command description for tooltip */
  description?: string;
  /** Optional: the full prompt for tooltip */
  prompt?: string;
  /** Additional class names */
  className?: string;
}

/**
 * ChipInlineDisplay - Renders a slash command chip inline in message text.
 *
 * Used to display chips that were part of the original user message,
 * parsed from chip markers in the message content.
 *
 * Displays: /command-key
 */
export const ChipInlineDisplay = memo(function ChipInlineDisplay({
  commandKey,
  title,
  description,
  prompt,
  className,
}: ChipInlineDisplayProps) {
  const chip = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 mx-0.5 rounded-md bg-primary/10 text-sm align-baseline',
        className
      )}
    >
      <span className="font-mono text-xs text-primary">/{commandKey}</span>
    </span>
  );

  const hasTooltipContent = title || description || prompt;

  if (hasTooltipContent) {
    return (
      <Tooltip
        content={
          <div className="max-w-xs max-h-64 overflow-y-auto text-primary-foreground">
            {title && (
              <div className="font-semibold text-sm text-primary-foreground">
                {title}
              </div>
            )}
            {description && (
              <div className="opacity-80 mt-1">{description}</div>
            )}
            {prompt && (
              <div
                className={cn(
                  (title || description) &&
                    'mt-2 pt-2 border-t border-current/20'
                )}
              >
                {(title || description) && (
                  <div className="text-[10px] uppercase tracking-wide opacity-60 mb-1">
                    Prompt
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words opacity-90">
                  {prompt}
                </div>
              </div>
            )}
          </div>
        }
        side="top"
      >
        {chip}
      </Tooltip>
    );
  }

  return chip;
});

ChipInlineDisplay.displayName = 'ChipInlineDisplay';
