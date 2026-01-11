import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TRPCClientError } from '@trpc/client';
import { Plus, X } from 'lucide-react';
import { Text, Tabs, useToast } from '@agent-kit/ui';
import { trpc } from '../../lib/trpc';
import { AgentFormPageLayout } from '../../components/agents/AgentFormPageLayout';
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
  const { setActions, clearActions } = useHeaderActions();
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<AgentFormData>(
    DEFAULT_AGENT_FORM_DATA
  );
  const [activeTab, setActiveTab] = useState('basic');
  const [error, setError] = useState<string | null>(null);
  const [isThinkingValid, setIsThinkingValid] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = trpc.useUtils();

  // Set page title
  useEffect(() => {
    document.title = 'Create Agent | Agent Kit';
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

  // Fetch tools, models, and skills
  const toolsQuery = trpc.agents.listTools.useQuery();
  const modelsQuery = trpc.agents.listModels.useQuery();
  const providersQuery = trpc.agents.listProviders.useQuery();
  const skillsQuery = trpc.agents.listSkillsForAgent.useQuery();

  // Auto-select core system skills on initial load
  const hasInitializedSkills = useRef(false);
  useEffect(() => {
    if (
      skillsQuery.data &&
      !hasInitializedSkills.current &&
      formData.allowedSkillIds.length === 0
    ) {
      hasInitializedSkills.current = true;
      // Select system skills except agent-management
      const coreSystemSkills = skillsQuery.data
        .filter((s) => s.isSystem && s.key !== 'agent-management')
        .map((s) => s.id);
      if (coreSystemSkills.length > 0) {
        setFormData((prev) => ({ ...prev, allowedSkillIds: coreSystemSkills }));
      }
    }
  }, [skillsQuery.data, formData.allowedSkillIds.length]);

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
      setIsSubmitting(false);
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

    setIsSubmitting(true);
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
      allowedSkillIds: formData.allowedSkillIds,
      scopes: formData.scopes,
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
      <form ref={formRef} onSubmit={handleSubmit}>
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

              <SkillsSection formData={formData} onChange={updateFormData} />

              <AllowedSubAgentsSection
                formData={formData}
                onChange={updateFormData}
              />

              <PermissionsSection
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
      </form>
    </AgentFormPageLayout>
  );
}
