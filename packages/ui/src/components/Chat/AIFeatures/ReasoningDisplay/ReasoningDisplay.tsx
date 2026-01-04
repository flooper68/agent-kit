import { forwardRef, useState, useEffect } from 'react';
import { cn } from '../../../../lib/utils';
import { Collapsible } from '../../../Collapsible';
import { Text } from '../../../Typography';

export interface ReasoningDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string;
  label?: string;
  defaultExpanded?: boolean;
  /** Controlled expanded state - when provided, overrides internal state */
  expanded?: boolean;
  /** Duration of thinking in seconds - displays as "thought for X seconds" when collapsed */
  durationSeconds?: number;
}

export const ReasoningDisplay = forwardRef<
  HTMLDivElement,
  ReasoningDisplayProps
>(
  (
    {
      content,
      label,
      defaultExpanded = false,
      expanded,
      durationSeconds,
      className,
      ...props
    },
    ref
  ) => {
    // Track internal open state for controlled behavior
    const [isOpen, setIsOpen] = useState(expanded ?? defaultExpanded);

    // Sync with controlled expanded prop when it changes
    useEffect(() => {
      if (expanded !== undefined) {
        setIsOpen(expanded);
      }
    }, [expanded]);

    // Calculate display label based on duration
    const displayLabel =
      label ??
      (durationSeconds !== undefined
        ? `thought for ${durationSeconds} ${durationSeconds === 1 ? 'second' : 'seconds'}`
        : 'Reasoning');

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div ref={ref} className={cn('text-sm mb-3', className)} {...props}>
          <Collapsible.Trigger className="py-1 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <span className="text-label-12">{displayLabel}</span>
            <svg
              className="h-3 w-3 ml-auto transition-transform [[data-state=open]_&]:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </Collapsible.Trigger>

          <Collapsible.Content>
            <div className="px-3 py-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20">
              <Text
                size="13"
                variant="muted"
                className="whitespace-pre-wrap italic"
              >
                {content}
              </Text>
            </div>
          </Collapsible.Content>
        </div>
      </Collapsible>
    );
  }
);

ReasoningDisplay.displayName = 'ReasoningDisplay';
