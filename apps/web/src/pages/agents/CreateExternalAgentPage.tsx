import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Text, Textarea, useToast } from '@agent-kit/ui';
import { trpc } from '../../lib/trpc';
import { AgentFormPageLayout } from '../../components/agents/AgentFormPageLayout';
import { useHeaderActions } from '../../contexts/HeaderActionsContext';

export function CreateExternalAgentPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { clearActions } = useHeaderActions();
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // Clear header actions on mount
  useEffect(() => {
    clearActions();
  }, [clearActions]);

  // Set page title
  useEffect(() => {
    document.title = 'Create Local Agent | Agent Kit';
  }, []);

  const createMutation = trpc.agents.createExternal.useMutation({
    onSuccess: (data) => {
      addToast({
        message: 'Local agent created successfully',
        variant: 'success',
      });
      utils.agents.listExternal.invalidate();
      utils.agents.list.invalidate();
      // Navigate back with secret key in state
      navigate('/app/agents', {
        state: {
          revealSecretKey: {
            key: data.secretKey,
            agentName: data.agent.name,
          },
          activeTab: 'local',
        },
      });
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate({
      key: key.trim().toLowerCase().replace(/\s+/g, '-'),
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <AgentFormPageLayout
      title="Create Local Agent"
      description="Create a new local agent that connects via WebSocket."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/50 p-3">
            <Text className="text-sm text-destructive">{error}</Text>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Key</label>
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="my-agent"
            required
            pattern="^[a-zA-Z0-9_-]+$"
            title="Key can only contain letters, numbers, underscores, and hyphens"
          />
          <Text className="text-xs text-muted-foreground">
            Unique identifier used for spawning. Letters, numbers, underscores,
            and hyphens only.
          </Text>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Custom Agent"
            required
          />
          <Text className="text-xs text-muted-foreground">
            Display name shown in the UI.
          </Text>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description (optional)</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A helpful assistant for..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/app/agents')}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Create Agent
          </Button>
        </div>
      </form>
    </AgentFormPageLayout>
  );
}
