import { AppAgentPanel } from '../components/AppAgentPanel';

export function DashboardPage() {
  return (
    <div className="h-full">
      <AppAgentPanel
        emptyStateConfig={{
          title: 'How can I help?',
          description: 'Ask me anything or try one of the suggestions below.',
        }}
        suggestions={[
          { id: '1', text: 'What time is it?' },
          { id: '2', text: 'Tell me a joke' },
          { id: '3', text: 'Help me with code' },
        ]}
      />
    </div>
  );
}
