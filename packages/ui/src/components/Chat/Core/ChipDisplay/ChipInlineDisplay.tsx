import { memo } from 'react';
import { cn } from '../../../../lib/utils';

export interface ChipInlineDisplayProps {
  /** The slash command key (e.g., "summarize") */
  commandKey: string;
  /** Display name (e.g., "Summarize") */
  name: string;
  /** Optional: show the full prompt on hover */
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
 * Displays: /command-key  Name
 */
export const ChipInlineDisplay = memo(function ChipInlineDisplay({
  commandKey,
  name,
  prompt,
  className,
}: ChipInlineDisplayProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 mx-0.5 rounded-md bg-primary/10 text-sm align-baseline',
        className
      )}
      title={prompt}
    >
      <span className="font-mono text-xs text-primary">/{commandKey}</span>
      <span className="text-xs text-muted-foreground">{name}</span>
    </span>
  );
});

ChipInlineDisplay.displayName = 'ChipInlineDisplay';
