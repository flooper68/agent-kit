import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TRPCClientError } from '@trpc/client';
import { Button, Text, Tabs, useToast } from '@agent-kit/ui';
import { trpc } from '../../lib/trpc';
import { AgentFormPageLayout } from '../../components/agents/AgentFormPageLayout';
import { IdentitySection } from '../../components/agent-builder/sections/IdentitySection';
import { BasicModelSection } from '../../components/agent-builder/sections/BasicModelSection';
import { AdvancedModelSection } from '../../components/agent-builder/sections/AdvancedModelSection';
import { SystemPromptSection } from '../../components/agent-builder/sections/SystemPromptSection';
import { ToolsSection } from '../../components/agent-builder/sections/ToolsSection';
import { AllowedSubAgentsSection } from '../../components/agent-builder/sections/AllowedSubAgentsSection';
import {
  type AgentFormData,
  DEFAULT_AGENT_FORM_DATA,
} from '../../components/agent-builder/types';
import { useHeaderActions } from '../../contexts/HeaderActionsContext';

interface ValidationFieldError {
  field: string;
}

/**
 * Parse TRPC validation error into field errors
 */
function parseValidationError(error: unknown): ValidationFieldError[] {
  if (error instanceof TRPCClientError) {
    const cause = error.data?.cause as
      | { type?: string; fieldErrors?: ValidationFieldError[] }
      | undefined;
    if (cause?.type === 'VALIDATION_ERROR' && cause.fieldErrors) {
      return cause.fieldErrors;
    }
  }
  return [];
}

export function CreateServerAgentPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { clearActions } = useHeaderActions();
  const [formData, setFormData] = useState<AgentFormData>(
    DEFAULT_AGENT_FORM_DATA
  );
  const [activeTab, setActiveTab] = useState('basic');
  const [error, setError] = useState<string | null>(null);
  const [isThinkingValid, setIsThinkingValid] = useState(true);

  const utils = trpc.useUtils();

  // Clear header actions on mount
  useEffect(() => {
    clearActions();
  }, [clearActions]);

  // Set page title
  useEffect(() => {
    document.title = 'Create Agent | Agent Kit';
  }, []);

  // Fetch tools and models
  const toolsQuery = trpc.agents.listTools.useQuery();
  const modelsQuery = trpc.agents.listModels.useQuery();
  const providersQuery = trpc.agents.listProviders.useQuery();

  // Update model when provider changes
  useEffect(() => {
    if (modelsQuery.data) {
      const providerModels = modelsQuery.data.filter(
        (m) => m.provider === formData.provider
      );
      const currentModelValid = providerModels.some(
        (m) => m.id === formData.model
      );
      if (!currentModelValid && providerModels.length > 0) {
        const firstModel = providerModels[0];
        if (firstModel) {
          setFormData((prev) => ({ ...prev, model: firstModel.id }));
        }
      }
    }
  }, [formData.provider, modelsQuery.data, formData.model]);

  const createMutation = trpc.agents.createServer.useMutation({
    onSuccess: () => {
      addToast({ message: 'Agent created successfully', variant: 'success' });
      utils.agents.listServer.invalidate();
      utils.agents.list.invalidate();
      navigate('/app/agents');
    },
    onError: (err) => {
      // Parse validation errors and switch to advanced tab if needed
      const errors = parseValidationError(err);
      if (errors.some((e) => e.field.startsWith('thinkingConfig'))) {
        setActiveTab('advanced');
      }
      setError(err.message);
    },
  });

  const handleThinkingValidationChange = useCallback((isValid: boolean) => {
    setIsThinkingValid(isValid);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check client-side validation before submitting
    if (!isThinkingValid) {
      setActiveTab('advanced');
      setError('Please fix validation errors before submitting');
      return;
    }

    createMutation.mutate({
      key: formData.key.trim().toLowerCase().replace(/\s+/g, '-'),
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      provider: formData.provider,
      model: formData.model,
      systemPrompt: formData.systemPrompt.trim(),
      tools: formData.tools,
      temperature: formData.temperature ?? undefined,
      maxOutputTokens: formData.maxOutputTokens ?? undefined,
      thinkingConfig: formData.thinkingConfig,
      isFavorite: formData.isFavorite,
      allowedSubagents: formData.allowedSubagents,
    });
  };

  const updateFormData = (updates: Partial<AgentFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const currentModel = modelsQuery.data?.find((m) => m.id === formData.model);

  return (
    <AgentFormPageLayout
      title="Create Agent"
      description="Configure your custom AI agent with specific capabilities."
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/50 p-3 mb-4">
            <Text className="text-sm text-destructive">{error}</Text>
          </div>
        )}

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
                formData={formData}
                onChange={updateFormData}
                mode="create"
              />

              <BasicModelSection
                formData={formData}
                onChange={updateFormData}
                providers={providersQuery.data ?? []}
                models={modelsQuery.data ?? []}
                currentModel={currentModel}
              />

              <SystemPromptSection
                formData={formData}
                onChange={updateFormData}
              />

              <ToolsSection
                formData={formData}
                onChange={updateFormData}
                tools={toolsQuery.data ?? []}
              />

              <AllowedSubAgentsSection
                formData={formData}
                onChange={updateFormData}
              />
            </Tabs.Content>

            <Tabs.Content value="advanced" className="mt-0 space-y-8">
              <AdvancedModelSection
                formData={formData}
                onChange={updateFormData}
                currentModel={currentModel}
                onValidationChange={handleThinkingValidationChange}
              />
            </Tabs.Content>
          </div>
        </Tabs>

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
