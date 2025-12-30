import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';
import type { SuggestionChip } from '../../../types/chat';

const containerVariants = cva('', {
  variants: {
    layout: {
      horizontal: 'flex flex-wrap gap-2',
      grid: 'grid grid-cols-2 gap-2',
    },
  },
  defaultVariants: {
    layout: 'horizontal',
  },
});

const chipVariants = cva(
  [
    'inline-flex items-center justify-center px-3 py-2 rounded-lg',
    'text-sm font-medium transition-colors cursor-pointer',
    'border border-border bg-background hover:bg-muted',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  ],
  {
    variants: {
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-2 text-sm',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface SuggestionChipsProps
  extends
    VariantProps<typeof containerVariants>,
    VariantProps<typeof chipVariants> {
  suggestions: SuggestionChip[];
  onSuggestionClick?: (suggestion: SuggestionChip) => void;
}

export const SuggestionChips = forwardRef<HTMLDivElement, SuggestionChipsProps>(
  ({ suggestions, onSuggestionClick, layout, size }, ref) => {
    if (suggestions.length === 0) {
      return null;
    }

    return (
      <div ref={ref} className={cn(containerVariants({ layout }))}>
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            onClick={() => onSuggestionClick?.(suggestion)}
            className={cn(chipVariants({ size }))}
          >
            {suggestion.text}
          </button>
        ))}
      </div>
    );
  }
);

SuggestionChips.displayName = 'SuggestionChips';
