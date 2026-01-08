import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TRPCClientError } from '@trpc/client';
import { Button, Input, Text, Textarea, Tabs, useToast } from '@agent-kit/ui';
import { trpc } from '../../lib/trpc';
import { AgentFormPageLayout } from '../../components/agents/AgentFormPageLayout';
import { AgentFormPageSkeleton } from '../../components/skeletons/AgentFormPageSkeleton';
import { IdentitySection } from '../../components/agent-builder/sections/IdentitySection';
import { BasicModelSection } from '../../components/agent-builder/sections/BasicModelSection';
import { AdvancedModelSection } from '../../components/agent-builder/sections/AdvancedModelSection';
import { SystemPromptSection } from '../../components/agent-builder/sections/SystemPromptSection';
import { ToolsSection } from '../../components/agent-builder/sections/ToolsSection';
import {
  type AgentFormData,
  DEFAULT_AGENT_FORM_DATA,
} from '../../components/agent-builder/types';
import type { FieldError } from '../../components/agent-builder/providers';
import { useHeaderActions } from '../../contexts/HeaderActionsContext';

/**
 * Parse TRPC validation error into field errors
 */
function parseValidationError(error: unknown): FieldError[] {
  if (error instanceof TRPCClientError) {
    const cause = error.data?.cause as { type?: string; fieldErrors?: FieldError[] } | undefined;
    if (cause?.type === 'VALIDATION_ERROR' && cause.fieldErrors) {
      return cause.fieldErrors;
    }
  }
  return [];
}

export function EditAgentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { clearActions } = useHeaderActions();

  // Server agent form state
  const [serverFormData, setServerFormData] = useState<AgentFormData>(
    DEFAULT_AGENT_FORM_DATA
  );
  const [activeTab, setActiveTab] = useState('basic');
  const [isThinkingValid, setIsThinkingValid] = useState(true);

  // External agent form state
  const [externalKey, setExternalKey] = useState('');
  const [externalName, setExternalName] = useState('');
  const [externalDescription, setExternalDescription] = useState('');

  // Refs to track last saved state for autosave
  const lastSavedServerDataRef = useRef<AgentFormData | null>(null);
  const lastSavedExternalDataRef = useRef<{ key: string; name: string; description: string } | null>(null);

  const utils = trpc.useUtils();

  // Clear header actions on mount
  useEffect(() => {
    clearActions();
  }, [clearActions]);

  // Fetch the agent
  const agentQuery = trpc.agents.getCustom.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  // Determine if this is a server agent (has provider field)
  const isServerAgent = useMemo(() => {
    if (!agentQuery.data) return null;
    return !!agentQuery.data.provider;
  }, [agentQuery.data]);

  // Set page title
  useEffect(() => {
    if (agentQuery.data) {
      document.title = `Edit ${agentQuery.data.name} | Agent Kit`;
    }
  }, [agentQuery.data]);

  // Initialize form data when agent loads
  useEffect(() => {
    if (agentQuery.data) {
      if (isServerAgent) {
        const formData: AgentFormData = {
          key: agentQuery.data.key,
          name: agentQuery.data.name,
          description: agentQuery.data.description ?? '',
          provider: (agentQuery.data.provider as 'anthropic' | 'openai' | 'gemini') ?? 'anthropic',
          model: agentQuery.data.model ?? DEFAULT_AGENT_FORM_DATA.model,
          systemPrompt: agentQuery.data.systemPrompt ?? DEFAULT_AGENT_FORM_DATA.systemPrompt,
          tools: agentQuery.data.tools ?? [],
          temperature: agentQuery.data.temperature,
          maxOutputTokens: agentQuery.data.maxOutputTokens,
          maxContextTokens: agentQuery.data.maxContextTokens ?? null,
          thinkingConfig: agentQuery.data.thinkingConfig as AgentFormData['thinkingConfig'],
          isFavorite: agentQuery.data.isFavorite ?? false,
        };
        setServerFormData(formData);
        lastSavedServerDataRef.current = formData;
      } else {
        const externalData = {
          key: agentQuery.data.key,
          name: agentQuery.data.name,
          description: agentQuery.data.description ?? '',
        };
        setExternalKey(externalData.key);
        setExternalName(externalData.name);
        setExternalDescription(externalData.description);
        lastSavedExternalDataRef.current = externalData;
      }
    }
  }, [agentQuery.data, isServerAgent]);

  // Fetch tools and models for server agent form
  const toolsQuery = trpc.agents.listTools.useQuery(undefined, {
    enabled: isServerAgent === true,
  });
  const modelsQuery = trpc.agents.listModels.useQuery(undefined, {
    enabled: isServerAgent === true,
  });
  const providersQuery = trpc.agents.listProviders.useQuery(undefined, {
    enabled: isServerAgent === true,
  });

  // Update model when provider changes (for server agents)
  useEffect(() => {
    if (isServerAgent && modelsQuery.data) {
      const providerModels = modelsQuery.data.filter(
        (m) => m.provider === serverFormData.provider
      );
      const currentModelValid = providerModels.some(
        (m) => m.id === serverFormData.model
      );
      if (!currentModelValid && providerModels.length > 0) {
        const firstModel = providerModels[0];
        if (firstModel) {
          setServerFormData((prev) => ({ ...prev, model: firstModel.id }));
        }
      }
    }
  }, [isServerAgent, serverFormData.provider, modelsQuery.data, serverFormData.model]);

  // Mutation for autosave
  const autosaveMutation = trpc.agents.updateCustom.useMutation({
    onSuccess: () => {
      addToast({ message: 'Changes saved', variant: 'success' });
      utils.agents.listServer.invalidate();
      utils.agents.listExternal.invalidate();
      utils.agents.list.invalidate();
    },
    onError: (err) => {
      // Parse validation errors
      const errors = parseValidationError(err);
      if (errors.length > 0) {
        // Show first error in toast
        const firstError = errors[0];
        addToast({
          message: `Validation error: ${firstError?.message ?? err.message}`,
          variant: 'error',
        });
        // Switch to advanced tab if thinking-related errors
        if (errors.some((e) => e.field.startsWith('thinkingConfig'))) {
          setActiveTab('advanced');
        }
      } else {
        addToast({ message: `Failed to save: ${err.message}`, variant: 'error' });
      }
    },
  });

  const handleThinkingValidationChange = useCallback((isValid: boolean) => {
    setIsThinkingValid(isValid);
  }, []);

  const updateServerFormData = (updates: Partial<AgentFormData>) => {
    setServerFormData((prev) => ({ ...prev, ...updates }));
  };

  // Autosave handler for server agent form
  const handleServerAutosave = useCallback(() => {
    if (!id || !lastSavedServerDataRef.current) return;
    if (autosaveMutation.isPending) return;

    // Don't autosave if there are validation errors
    if (!isThinkingValid) {
      return;
    }

    // Compare current form data with last saved data
    if (JSON.stringify(serverFormData) === JSON.stringify(lastSavedServerDataRef.current)) {
      return; // No changes
    }

    // Update the ref before mutation to prevent duplicate saves
    lastSavedServerDataRef.current = { ...serverFormData };

    autosaveMutation.mutate({
      id,
      key: serverFormData.key.trim().toLowerCase().replace(/\s+/g, '-'),
      name: serverFormData.name.trim(),
      description: serverFormData.description.trim() || undefined,
      provider: serverFormData.provider,
      model: serverFormData.model,
      systemPrompt: serverFormData.systemPrompt.trim(),
      tools: serverFormData.tools,
      temperature: serverFormData.temperature,
      maxOutputTokens: serverFormData.maxOutputTokens,
      thinkingConfig: serverFormData.thinkingConfig,
      isFavorite: serverFormData.isFavorite,
    });
  }, [id, serverFormData, autosaveMutation, isThinkingValid]);

  // Autosave handler for external agent form
  const handleExternalAutosave = useCallback(() => {
    if (!id || !lastSavedExternalDataRef.current) return;
    if (autosaveMutation.isPending) return;

    const currentData = { key: externalKey, name: externalName, description: externalDescription };

    // Compare current form data with last saved data
    if (JSON.stringify(currentData) === JSON.stringify(lastSavedExternalDataRef.current)) {
      return; // No changes
    }

    // Update the ref before mutation to prevent duplicate saves
    lastSavedExternalDataRef.current = { ...currentData };

    autosaveMutation.mutate({
      id,
      key: externalKey.trim().toLowerCase().replace(/\s+/g, '-'),
      name: externalName.trim(),
      description: externalDescription.trim() || undefined,
    });
  }, [id, externalKey, externalName, externalDescription, autosaveMutation]);

  const currentModel = modelsQuery.data?.find(
    (m) => m.id === serverFormData.model
  );

  // Loading state
  if (agentQuery.isLoading || isServerAgent === null) {
    return <AgentFormPageSkeleton />;
  }

  // Error state - agent not found
  if (agentQuery.error || !agentQuery.data) {
    return (
      <AgentFormPageLayout title="Agent Not Found">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Text className="text-muted-foreground mb-4">
            The agent you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </Text>
          <Button onClick={() => navigate('/app/agents')}>
            Back to Agents
          </Button>
        </div>
      </AgentFormPageLayout>
    );
  }

  // Server agent form
  if (isServerAgent) {
    return (
      <AgentFormPageLayout
        title="Edit Agent"
        description={`Update configuration for ${agentQuery.data.name}`}
      >
        <div>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col"
          >
            <Tabs.List className="grid grid-cols-2 w-full">
              <Tabs.Trigger value="basic">Basic</Tabs.Trigger>
              <Tabs.Trigger value="advanced">Advanced</Tabs.Trigger>
            </Tabs.List>

            <div className="py-4">
              <Tabs.Content value="basic" className="mt-0 space-y-8">
                <IdentitySection
                  formData={serverFormData}
                  onChange={updateServerFormData}
                  mode="edit"
                  onBlur={handleServerAutosave}
                />

                <BasicModelSection
                  formData={serverFormData}
                  onChange={updateServerFormData}
                  providers={providersQuery.data ?? []}
                  models={modelsQuery.data ?? []}
                  currentModel={currentModel}
                  onBlur={handleServerAutosave}
                />

                <SystemPromptSection
                  formData={serverFormData}
                  onChange={updateServerFormData}
                  onBlur={handleServerAutosave}
                />

                <ToolsSection
                  formData={serverFormData}
                  onChange={updateServerFormData}
                  tools={toolsQuery.data ?? []}
                  onBlur={handleServerAutosave}
                />
              </Tabs.Content>

              <Tabs.Content value="advanced" className="mt-0 space-y-8">
                <AdvancedModelSection
                  formData={serverFormData}
                  onChange={updateServerFormData}
                  currentModel={currentModel}
                  onBlur={handleServerAutosave}
                  onValidationChange={handleThinkingValidationChange}
                />
              </Tabs.Content>
            </div>
          </Tabs>

        </div>
      </AgentFormPageLayout>
    );
  }

  // External agent form
  return (
    <AgentFormPageLayout
      title="Edit Local Agent"
      description={`Update configuration for ${agentQuery.data.name}`}
      maxWidth="lg"
    >
      <div className="space-y-6">

        <div className="space-y-2">
          <label className="text-sm font-medium">Key</label>
          <Input
            value={externalKey}
            onChange={(e) => setExternalKey(e.target.value)}
            placeholder="my-agent"
            required
            pattern="^[a-zA-Z0-9_-]+$"
            title="Key can only contain letters, numbers, underscores, and hyphens"
            disabled
          />
          <Text className="text-xs text-muted-foreground">
            Agent key cannot be changed after creation.
          </Text>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <Input
            value={externalName}
            onChange={(e) => setExternalName(e.target.value)}
            onBlur={handleExternalAutosave}
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
            value={externalDescription}
            onChange={(e) => setExternalDescription(e.target.value)}
            onBlur={handleExternalAutosave}
            placeholder="A helpful assistant for..."
            rows={3}
          />
        </div>

      </div>
    </AgentFormPageLayout>
  );
}
