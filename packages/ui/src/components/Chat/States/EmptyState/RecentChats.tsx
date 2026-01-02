import { forwardRef } from 'react';
import { Lock, MoreHorizontal, Trash2, MessageSquare } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { TaskHistoryItem } from '../../../../types/chat';
import { DropdownMenu } from '../../../DropdownMenu';

export interface RecentChatsProps extends React.HTMLAttributes<HTMLDivElement> {
  chats: TaskHistoryItem[];
  onChatClick?: (chat: TaskHistoryItem) => void;
  onDeleteClick?: (chat: TaskHistoryItem) => void;
  maxItems?: number;
  /** Show empty state when no chats instead of hiding */
  showEmptyState?: boolean;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const UserAvatar = ({ user }: { user?: TaskHistoryItem['user'] }) => {
  const bgColor =
    user?.avatarColor ?? 'linear-gradient(135deg, #22c55e 0%, #eab308 100%)';

  return (
    <div
      className="h-4 w-4 rounded-sm shrink-0"
      style={{
        background: bgColor,
      }}
    />
  );
};

const ChatCard = ({
  chat,
  onClick,
  onDelete,
}: {
  chat: TaskHistoryItem;
  onClick?: () => void;
  onDelete?: () => void;
}) => {
  const hasDescription = chat.description || chat.preview;

  return (
    <div
      className={cn(
        'flex flex-col border border-border rounded-lg p-4',
        'hover:border-border/80 hover:bg-muted/30 transition-colors',
        'cursor-pointer'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Title row */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-foreground truncate">
          {chat.title}
        </span>
        {chat.isPrivate && (
          <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </div>

      {/* Description/preview */}
      {hasDescription && (
        <p className="mt-1 text-sm text-muted-foreground truncate">
          {chat.description || chat.preview}
        </p>
      )}

      {/* Bottom row */}
      <div
        className={cn(
          'flex items-center justify-between gap-2',
          hasDescription ? 'mt-3' : 'mt-2'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {chat.user && (
            <>
              <UserAvatar user={chat.user} />
              <span className="text-xs text-muted-foreground truncate">
                {chat.user.name}
              </span>
            </>
          )}
          <span className="text-xs text-muted-foreground">
            Updated {formatDate(chat.updatedAt ?? chat.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {chat.agentName && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
              {chat.agentName}
            </span>
          )}
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="p-1 hover:bg-muted rounded transition-colors"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                aria-label="More options"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item
                variant="destructive"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export const RecentChats = forwardRef<HTMLDivElement, RecentChatsProps>(
  (
    {
      chats,
      onChatClick,
      onDeleteClick,
      maxItems = 4,
      showEmptyState = false,
      className,
      ...props
    },
    ref
  ) => {
    if (chats.length === 0 && !showEmptyState) return null;

    const displayChats = chats.slice(0, maxItems);

    return (
      <div
        ref={ref}
        className={cn('w-full max-w-3xl mt-8', className)}
        {...props}
      >
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
            <MessageSquare className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No recent chats</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Your conversations will appear here
            </p>
          </div>
        ) : (
          <div
            className={cn(
              'grid gap-3',
              displayChats.length === 1
                ? 'grid-cols-1 max-w-sm mx-auto'
                : 'grid-cols-2'
            )}
          >
            {displayChats.map((chat) => (
              <ChatCard
                key={chat.id}
                chat={chat}
                onClick={() => onChatClick?.(chat)}
                onDelete={() => onDeleteClick?.(chat)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

RecentChats.displayName = 'RecentChats';
