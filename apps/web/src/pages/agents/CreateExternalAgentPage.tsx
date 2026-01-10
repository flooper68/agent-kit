import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { Input, Text, Textarea, useToast } from '@agent-kit/ui';
import { trpc } from '../../lib/trpc';
import { AgentFormPageLayout } from '../../components/agents/AgentFormPageLayout';
import { AllowedSubAgentsSection } from '../../components/agent-builder/sections/AllowedSubAgentsSection';
import {
  type AgentFormData,
  type AllowedSubagents,
  DEFAULT_AGENT_FORM_DATA,
} from '../../components/agent-builder/types';
import { useHeaderActions } from '../../contexts/HeaderActionsContext';

export function CreateExternalAgentPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { setActions, clearActions } = useHeaderActions();
  const formRef = useRef<HTMLFormElement>(null);
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allowedSubagents, setAllowedSubagents] = useState<AllowedSubagents>(
    {}
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = trpc.useUtils();

  // Set page title
  useEffect(() => {
    document.title = 'Create External Agent | Agent Kit';
  }, []);

  // Set header actions
  useEffect(() => {
    setActions([
      {
        id: 'cancel',
        label: 'Cancel',
        icon: <X className="h-4 w-4" />,
        onClick: () => navigate('/app/agents'),
        variant: 'outline',
      },
      {
        id: 'create',
        label: isSubmitting ? 'Creating...' : 'Create',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => formRef.current?.requestSubmit(),
        variant: 'primary',
      },
    ]);
    return () => clearActions();
  }, [setActions, clearActions, navigate, isSubmitting]);

  const createMutation = trpc.agents.createExternal.useMutation({
    onSuccess: (data) => {
      addToast({
        message: 'External agent created successfully',
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
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    createMutation.mutate({
      key: key.trim().toLowerCase().replace(/\s+/g, '-'),
      name: name.trim(),
      description: description.trim() || undefined,
      allowedSubagents,
    });
  };

  // Create a partial formData object for the AllowedSubAgentsSection
  const formDataForSection: AgentFormData = {
    ...DEFAULT_AGENT_FORM_DATA,
    allowedSubagents,
  };

  return (
    <AgentFormPageLayout
      title="Create External Agent"
      description="Create a new external agent that connects via WebSocket."
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
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

        <AllowedSubAgentsSection
          formData={formDataForSection}
          onChange={(updates) => {
            if (updates.allowedSubagents) {
              setAllowedSubagents(updates.allowedSubagents);
            }
          }}
        />
      </form>
    </AgentFormPageLayout>
  );
}
