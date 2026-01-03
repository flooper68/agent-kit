import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../Button';
import { Heading, Text } from '../../../Typography';
import type { SuggestionChip, TaskHistoryItem } from '../../../../types/chat';
import { RecentChats } from './RecentChats';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  suggestions?: SuggestionChip[];
  onSuggestionClick?: (suggestion: SuggestionChip) => void;
  icon?: React.ReactNode;
  /** Input element to render inside the card */
  inputElement?: React.ReactNode;
  /** Recent chats to display below suggestions */
  recentChats?: TaskHistoryItem[];
  /** Callback when a recent chat is clicked */
  onRecentChatClick?: (chat: TaskHistoryItem) => void;
  /** Callback when a recent chat is deleted */
  onRecentChatDelete?: (chat: TaskHistoryItem) => void;
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
      recentChats,
      onRecentChatClick,
      onRecentChatDelete,
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

        <Heading size="32" className="tracking-tight mb-2">
          {title}
        </Heading>

        {description && (
          <Text variant="muted" className="max-w-md mb-8">
            {description}
          </Text>
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

        {recentChats && (
          <RecentChats
            chats={recentChats}
            onChatClick={onRecentChatClick}
            onDeleteClick={onRecentChatDelete}
            maxItems={3}
            showEmptyState
          />
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';
