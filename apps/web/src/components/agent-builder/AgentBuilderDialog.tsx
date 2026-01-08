import { useState, useEffect } from 'react';
import { Dialog, Button, Text, Tabs } from '@agent-kit/ui';
import { trpc } from '../../lib/trpc';
import { IdentitySection } from './sections/IdentitySection';
import { BasicModelSection } from './sections/BasicModelSection';
import { AdvancedModelSection } from './sections/AdvancedModelSection';
import { SystemPromptSection } from './sections/SystemPromptSection';
import { ToolsSection } from './sections/ToolsSection';
import { type AgentFormData, DEFAULT_AGENT_FORM_DATA } from './types';

export interface AgentBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initialData?: Partial<AgentFormData>;
  onSubmit: (data: AgentFormData) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function AgentBuilderDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  onSubmit,
  isLoading,
  error,
}: AgentBuilderDialogProps) {
  const [formData, setFormData] = useState<AgentFormData>({
    ...DEFAULT_AGENT_FORM_DATA,
    ...initialData,
  });
  const [activeTab, setActiveTab] = useState('basic');

  // Fetch tools and models
  const toolsQuery = trpc.agents.listTools.useQuery();
  const modelsQuery = trpc.agents.listModels.useQuery();
  const providersQuery = trpc.agents.listProviders.useQuery();

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      setFormData({
        ...DEFAULT_AGENT_FORM_DATA,
        ...initialData,
      });
      setActiveTab('basic');
    }
  }, [open, initialData]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      key: formData.key.trim().toLowerCase().replace(/\s+/g, '-'),
      name: formData.name.trim(),
      description: formData.description.trim(),
      systemPrompt: formData.systemPrompt.trim(),
    });
  };

  const updateFormData = (updates: Partial<AgentFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const currentModel = modelsQuery.data?.find((m) => m.id === formData.model);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        size="2xl"
        className="max-h-[90vh] overflow-hidden flex flex-col"
      >
        <Dialog.Header>
          <Dialog.Title>
            {mode === 'create' ? 'Create Custom Agent' : 'Edit Agent'}
          </Dialog.Title>
          <Dialog.Description>
            {mode === 'create'
              ? 'Configure your custom AI agent with specific capabilities.'
              : 'Update your agent configuration.'}
          </Dialog.Description>
        </Dialog.Header>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-hidden flex flex-col mt-4"
        >
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/50 p-3 mb-4">
              <Text className="text-sm text-destructive">{error}</Text>
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <Tabs.List className="grid grid-cols-2 w-full">
              <Tabs.Trigger value="basic">Basic</Tabs.Trigger>
              <Tabs.Trigger value="advanced">Advanced</Tabs.Trigger>
            </Tabs.List>

            <div className="flex-1 overflow-y-auto py-4 min-h-[500px]">
              <Tabs.Content value="basic" className="mt-0 space-y-8">
                <IdentitySection
                  formData={formData}
                  onChange={updateFormData}
                  mode={mode}
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
              </Tabs.Content>

              <Tabs.Content value="advanced" className="mt-0 space-y-8">
                <AdvancedModelSection
                  formData={formData}
                  onChange={updateFormData}
                  currentModel={currentModel}
                />
              </Tabs.Content>
            </div>
          </Tabs>

          <Dialog.Footer className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {mode === 'create' ? 'Create Agent' : 'Save Changes'}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
