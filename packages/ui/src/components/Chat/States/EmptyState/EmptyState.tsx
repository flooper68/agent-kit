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
  /** Input element to render inside the card */
  inputElement?: React.ReactNode;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      title = 'How can I help you today?',
      description,
      suggestions = [],
      onSuggestionClick,
      icon,
      inputElement,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center h-full text-center px-4 py-8',
          className
        )}
        {...props}
      >
        {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}

        <h2 className="text-3xl tracking-tight font-semibold mb-2">{title}</h2>

        {description && (
          <p className="text-muted-foreground max-w-md mb-8">{description}</p>
        )}

        {inputElement && (
          <div className="w-full max-w-2xl mt-2">{inputElement}</div>
        )}

        {suggestions.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl mt-6">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion.id}
                variant="ghost"
                size="sm"
                onClick={() => onSuggestionClick?.(suggestion)}
                className="text-sm border-0 bg-muted/50 hover:bg-muted"
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
