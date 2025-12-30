import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../Button';
import type { SuggestionChip } from '../../../../types/chat';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  suggestions?: SuggestionChip[];
  onSuggestionClick?: (suggestion: SuggestionChip) => void;
  icon?: React.ReactNode;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      title = 'How can I help you today?',
      description,
      suggestions = [],
      onSuggestionClick,
      icon,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center h-full text-center px-4 py-12',
          className
        )}
        {...props}
      >
        {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
        <h2 className="text-2xl font-semibold mb-2">{title}</h2>
        {description && (
          <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
        )}

        {suggestions.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion.id}
                variant="outline"
                size="sm"
                onClick={() => onSuggestionClick?.(suggestion)}
                className="text-sm"
              >
                {suggestion.text}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';
