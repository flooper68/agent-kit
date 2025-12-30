import { forwardRef } from 'react';
import { Dialog } from '../../Dialog';
import { Button } from '../../Button';
import { ChatHistoryItemComponent } from './ChatHistoryItem';
import type { ChatHistoryItem } from '../../../types/chat';

export interface ChatHistorySidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chats: ChatHistoryItem[];
  selectedChatId?: string;
  onChatSelect?: (chatId: string) => void;
  onChatDelete?: (chatId: string) => void;
  onNewChat?: () => void;
}

// Plus icon for new chat
const PlusIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

// Close icon
const CloseIcon = () => (
  <svg
    className="h-5 w-5"
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

export const ChatHistorySidebar = forwardRef<
  HTMLDivElement,
  ChatHistorySidebarProps
>(
  (
    {
      open,
      onOpenChange,
      chats,
      selectedChatId,
      onChatSelect,
      onChatDelete,
      onNewChat,
    },
    _ref
  ) => {
    const handleChatSelect = (chatId: string) => {
      onChatSelect?.(chatId);
      onOpenChange(false);
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <Dialog.Content position="left" size="md" showOverlay>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Chat History</h2>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
                aria-label="Close sidebar"
              >
                <CloseIcon />
              </button>
            </div>

            {/* New Chat Button */}
            {onNewChat && (
              <div className="p-4 border-b">
                <Button
                  variant="outline"
                  onClick={() => {
                    onNewChat();
                    onOpenChange(false);
                  }}
                >
                  <PlusIcon />
                  New Chat
                </Button>
              </div>
            )}

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-2">
              {chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No chat history yet.
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Start a new conversation to see it here.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {chats.map((chat) => (
                    <ChatHistoryItemComponent
                      key={chat.id}
                      chat={chat}
                      isSelected={chat.id === selectedChatId}
                      onSelect={() => handleChatSelect(chat.id)}
                      onDelete={
                        onChatDelete ? () => onChatDelete(chat.id) : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog>
    );
  }
);

ChatHistorySidebar.displayName = 'ChatHistorySidebar';
