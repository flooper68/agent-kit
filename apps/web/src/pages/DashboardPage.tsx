import { useState, useCallback, useMemo } from 'react';
import { AgentPanel, MockChatService } from '@agent-kit/ui';
import type { TaskMessage, TaskStatus, ThinkingStatus } from '@agent-kit/ui';

export function DashboardPage() {
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [status, setStatus] = useState<TaskStatus>('ready');
  const [thinkingStatus, setThinkingStatus] = useState<ThinkingStatus>({
    isThinking: false,
  });

  const mockService = useMemo(() => {
    return new MockChatService(
      {
        onStatusChange: setStatus,
        onMessageAdd: (msg) => setMessages((prev) => [...prev, msg]),
        onMessageUpdate: (id, updates) =>
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
          ),
        onThinkingStatusChange: setThinkingStatus,
        onError: () => setStatus('error'),
      },
      { includeReasoning: true }
    );
  }, []);

  const handleSend = useCallback(
    (message: string) => {
      mockService.sendMessage(message);
    },
    [mockService]
  );

  const handleInterrupt = useCallback(() => {
    mockService.interrupt();
  }, [mockService]);

  return (
    <div className="h-full">
      <AgentPanel
        messages={messages}
        status={status}
        thinkingStatus={thinkingStatus}
        models={[
          { id: 'claude-sonnet', name: 'Claude Sonnet', provider: 'anthropic' },
          { id: 'claude-opus', name: 'Claude Opus', provider: 'anthropic' },
        ]}
        emptyStateConfig={{
          title: 'How can I help?',
          description: 'Ask me anything or try one of the suggestions below.',
        }}
        suggestions={[
          { id: '1', text: 'Create a new component' },
          { id: '2', text: 'Run tests' },
          { id: '3', text: 'Analyze code' },
        ]}
        onSend={handleSend}
        onInterrupt={handleInterrupt}
      />
    </div>
  );
}
