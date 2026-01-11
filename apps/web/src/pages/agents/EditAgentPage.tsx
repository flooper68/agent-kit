import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { AllowedSubAgentsSection } from '../../components/agent-builder/sections/AllowedSubAgentsSection';
import { SkillsSection } from '../../components/agent-builder/sections/SkillsSection';
import { PermissionsSection } from '../../components/agent-builder/sections/PermissionsSection';
import {
  type AgentFormData,
  type AllowedSubagents,
  DEFAULT_AGENT_FORM_DATA,
} from '../../components/agent-builder/types';
import type { FieldError } from '../../components/agent-builder/providers';
import { useHeaderActions } from '../../contexts/HeaderActionsContext';
import { useAutosave } from '../../hooks/useAutosave';

/**
 * Parse TRPC validation error into field errors
 */
function parseValidationError(error: unknown): FieldError[] {
  if (error instanceof TRPCClientError) {
    const cause = error.data?.cause as
      | { type?: string; fieldErrors?: FieldError[] }
      | undefined;
    if (cause?.type === 'VALIDATION_ERROR' && cause.fieldErrors) {
      return cause.fieldErrors;
    }
  }
  return [];
}

type ExternalFormData = {
  key: string;
  name: string;
  description: string;
  allowedSubagents: AllowedSubagents;
  allowedSkillIds: string[];
  allowedTools: string[];
  scopes: string[];
};

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
  const [externalAllowedSubagents, setExternalAllowedSubagents] =
    useState<AllowedSubagents>({});
  const [externalAllowedSkillIds, setExternalAllowedSkillIds] = useState<
    string[]
  >([]);
  const [externalAllowedTools, setExternalAllowedTools] = useState<string[]>(
    []
  );
  const [externalScopes, setExternalScopes] = useState<string[]>([]);

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
    return 'provider' in agentQuery.data;
  }, [agentQuery.data]);

  // Set page title
  useEffect(() => {
    if (agentQuery.data) {
      document.title = `Edit ${agentQuery.data.name} | Agent Kit`;
    }
  }, [agentQuery.data]);

  // Fetch tools for agent form (both server and external agents)
  const toolsQuery = trpc.agents.listTools.useQuery(undefined, {
    enabled: isServerAgent !== null,
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
  }, [
    isServerAgent,
    serverFormData.provider,
    modelsQuery.data,
    serverFormData.model,
  ]);

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
        addToast({
          message: `Failed to save: ${err.message}`,
          variant: 'error',
        });
      }
    },
  });

  const handleThinkingValidationChange = useCallback((isValid: boolean) => {
    setIsThinkingValid(isValid);
  }, []);

  const updateServerFormData = (updates: Partial<AgentFormData>) => {
    setServerFormData((prev) => ({ ...prev, ...updates }));
  };

  // External agent data object for autosave
  const externalFormData = useMemo(
    (): ExternalFormData => ({
      key: externalKey,
      name: externalName,
      description: externalDescription,
      allowedSubagents: externalAllowedSubagents,
      allowedSkillIds: externalAllowedSkillIds,
      allowedTools: externalAllowedTools,
      scopes: externalScopes,
    }),
    [
      externalKey,
      externalName,
      externalDescription,
      externalAllowedSubagents,
      externalAllowedSkillIds,
      externalAllowedTools,
      externalScopes,
    ]
  );

  // Autosave for server agents
  const serverAutosave = useAutosave({
    data: serverFormData,
    enabled: isServerAgent === true && !!id && isThinkingValid,
    onSave: useCallback(
      (data: AgentFormData, done: () => void) => {
        if (!id) {
          done();
          return;
        }
        const dataToSave = { ...data };
        autosaveMutation.mutate(
          {
            id,
            agentType: 'server' as const,
            key: data.key.trim().toLowerCase().replace(/\s+/g, '-'),
            name: data.name.trim(),
            description: data.description.trim() || undefined,
            provider: data.provider,
            model: data.model,
            systemPrompt: data.systemPrompt.trim(),
            tools: data.tools,
            temperature: data.temperature,
            maxOutputTokens: data.maxOutputTokens,
            thinkingConfig: data.thinkingConfig,
            isFavorite: data.isFavorite,
            allowedSubagents: data.allowedSubagents,
            allowedSkillIds: data.allowedSkillIds,
            scopes: data.scopes,
          },
          {
            onSuccess: () => {
              serverAutosave.lastSavedDataRef.current = dataToSave;
            },
            onSettled: done,
          }
        );
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [id, autosaveMutation]
    ),
  });

  // Autosave for external agents
  const externalAutosave = useAutosave({
    data: externalFormData,
    enabled: isServerAgent === false && !!id,
    onSave: useCallback(
      (data: ExternalFormData, done: () => void) => {
        if (!id) {
          done();
          return;
        }
        const dataToSave = { ...data };
        autosaveMutation.mutate(
          {
            id,
            agentType: 'external' as const,
            name: data.name.trim(),
            description: data.description.trim() || undefined,
            allowedSubagents: data.allowedSubagents,
            allowedSkillIds: data.allowedSkillIds,
            allowedTools: data.allowedTools,
            scopes: data.scopes,
          },
          {
            onSuccess: () => {
              externalAutosave.lastSavedDataRef.current = dataToSave;
            },
            onSettled: done,
          }
        );
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [id, autosaveMutation]
    ),
  });

  // Initialize form data when agent loads
  useEffect(() => {
    if (agentQuery.data) {
      // API returns allowedSubagents as { serverAgentIds, externalAgentIds }
      const allowedSubagents: AllowedSubagents =
        agentQuery.data.allowedSubagents ?? {};
      // API returns allowedSkillIds as string[]
      const allowedSkillIds: string[] = agentQuery.data.allowedSkillIds ?? [];

      // Check if it's a server agent using 'provider' in data for proper type narrowing
      if ('provider' in agentQuery.data) {
        const data = agentQuery.data;
        const formData: AgentFormData = {
          key: data.key,
          name: data.name,
          description: data.description ?? '',
          provider:
            (data.provider as 'anthropic' | 'openai' | 'gemini') ?? 'anthropic',
          model: data.model ?? DEFAULT_AGENT_FORM_DATA.model,
          systemPrompt:
            data.systemPrompt ?? DEFAULT_AGENT_FORM_DATA.systemPrompt,
          tools: data.tools ?? [],
          temperature: data.temperature,
          maxOutputTokens: data.maxOutputTokens,
          maxContextTokens: data.maxContextTokens ?? null,
          thinkingConfig:
            data.thinkingConfig as AgentFormData['thinkingConfig'],
          isFavorite: data.isFavorite ?? false,
          allowedSubagents,
          allowedSkillIds,
          scopes: data.scopes ?? [],
        };
        setServerFormData(formData);
        serverAutosave.lastSavedDataRef.current = formData;
      } else {
        // External agent - includes allowedTools and scopes
        const allowedTools: string[] = agentQuery.data.allowedTools ?? [];
        const scopes: string[] = agentQuery.data.scopes ?? [];
        const externalData: ExternalFormData = {
          key: agentQuery.data.key,
          name: agentQuery.data.name,
          description: agentQuery.data.description ?? '',
          allowedSubagents,
          allowedSkillIds,
          allowedTools,
          scopes,
        };
        setExternalKey(externalData.key);
        setExternalName(externalData.name);
        setExternalDescription(externalData.description);
        setExternalAllowedSubagents(externalData.allowedSubagents);
        setExternalAllowedSkillIds(externalData.allowedSkillIds);
        setExternalAllowedTools(externalData.allowedTools);
        setExternalScopes(externalData.scopes);
        externalAutosave.lastSavedDataRef.current = externalData;
      }
    }
  }, [
    agentQuery.data,
    serverAutosave.lastSavedDataRef,
    externalAutosave.lastSavedDataRef,
  ]);

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
            The agent you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
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
                  onBlur={serverAutosave.trigger}
                />

                <BasicModelSection
                  formData={serverFormData}
                  onChange={updateServerFormData}
                  providers={providersQuery.data ?? []}
                  models={modelsQuery.data ?? []}
                  currentModel={currentModel}
                  onBlur={serverAutosave.trigger}
                />

                <SystemPromptSection
                  formData={serverFormData}
                  onChange={updateServerFormData}
                  onBlur={serverAutosave.trigger}
                />

                <ToolsSection
                  formData={serverFormData}
                  onChange={updateServerFormData}
                  tools={toolsQuery.data ?? []}
                  onBlur={serverAutosave.trigger}
                />

                <PermissionsSection
                  formData={serverFormData}
                  onChange={updateServerFormData}
                  onBlur={serverAutosave.trigger}
                />

                <AllowedSubAgentsSection
                  formData={serverFormData}
                  onChange={updateServerFormData}
                  currentAgentId={id}
                  onBlur={serverAutosave.trigger}
                />

                <SkillsSection
                  formData={serverFormData}
                  onChange={updateServerFormData}
                  onBlur={serverAutosave.trigger}
                />
              </Tabs.Content>

              <Tabs.Content value="advanced" className="mt-0 space-y-8">
                <AdvancedModelSection
                  formData={serverFormData}
                  onChange={updateServerFormData}
                  currentModel={currentModel}
                  onBlur={serverAutosave.trigger}
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
      title="Edit External Agent"
      description={`Update configuration for ${agentQuery.data.name}`}
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
            onBlur={externalAutosave.trigger}
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
            onBlur={externalAutosave.trigger}
            placeholder="A helpful assistant for..."
            rows={3}
          />
        </div>

        <ToolsSection
          formData={{
            ...DEFAULT_AGENT_FORM_DATA,
            tools: externalAllowedTools,
          }}
          onChange={(updates) => {
            if (updates.tools) {
              setExternalAllowedTools(updates.tools);
            }
          }}
          tools={toolsQuery.data ?? []}
          onBlur={externalAutosave.trigger}
        />

        <PermissionsSection
          formData={{
            ...DEFAULT_AGENT_FORM_DATA,
            scopes: externalScopes,
          }}
          onChange={(updates) => {
            if (updates.scopes) {
              setExternalScopes(updates.scopes);
            }
          }}
          onBlur={externalAutosave.trigger}
        />

        <AllowedSubAgentsSection
          formData={{
            ...DEFAULT_AGENT_FORM_DATA,
            allowedSubagents: externalAllowedSubagents,
          }}
          onChange={(updates) => {
            if (updates.allowedSubagents) {
              setExternalAllowedSubagents(updates.allowedSubagents);
            }
          }}
          currentAgentId={id}
          onBlur={externalAutosave.trigger}
        />

        <SkillsSection
          formData={{
            ...DEFAULT_AGENT_FORM_DATA,
            allowedSkillIds: externalAllowedSkillIds,
          }}
          onChange={(updates) => {
            if (updates.allowedSkillIds) {
              setExternalAllowedSkillIds(updates.allowedSkillIds);
            }
          }}
          onBlur={externalAutosave.trigger}
        />
      </div>
    </AgentFormPageLayout>
  );
}
