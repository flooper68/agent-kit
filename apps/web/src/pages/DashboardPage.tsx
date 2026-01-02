import { useCallback } from 'react';
import type { TaskHistoryItem } from '@agent-kit/ui';
import { AppAgentPanel } from '../components/AppAgentPanel';
import { useChatHistory } from '../hooks/useChatHistory';
import { useSession } from '../contexts/SessionContext';

export function DashboardPage() {
  const { sessions } = useChatHistory({ limit: 3 });
  const { setSessionId, clearSession } = useSession();

  const handleRecentChatClick = useCallback(
    (chat: TaskHistoryItem) => {
      setSessionId(chat.id);
    },
    [setSessionId]
  );

  const handleNewChat = useCallback(() => {
    clearSession();
  }, [clearSession]);

  return (
    <div className="h-full">
      <AppAgentPanel
        onNewChat={handleNewChat}
        emptyStateConfig={{
          title: 'How can I help?',
          description: 'Ask me anything or try one of the suggestions below.',
        }}
        suggestions={[
          { id: '1', text: 'What time is it?' },
          { id: '2', text: 'Tell me a joke' },
          { id: '3', text: 'Help me with code' },
        ]}
        recentChats={sessions}
        onRecentChatClick={handleRecentChatClick}
      />
    </div>
  );
}
