import { Select, Text } from '@agent-kit/ui';
import type { AgentFormData, ModelInfo, ProviderInfo } from '../types';

interface BasicModelSectionProps {
  formData: AgentFormData;
  onChange: (updates: Partial<AgentFormData>) => void;
  providers: ProviderInfo[];
  models: ModelInfo[];
  currentModel?: ModelInfo;
  onBlur?: () => void;
}

export function BasicModelSection({
  formData,
  onChange,
  providers,
  models,
  currentModel,
  onBlur,
}: BasicModelSectionProps) {
  const providerModels = models.filter((m) => m.provider === formData.provider);

  const handleProviderChange = (provider: string) => {
    onChange({ provider: provider as AgentFormData['provider'] });
    onBlur?.();
  };

  const handleModelChange = (model: string) => {
    onChange({ model });
    onBlur?.();
  };

  return (
    <div className="space-y-4">
      {/* Provider Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Provider</label>
        <Select
          value={formData.provider}
          onValueChange={handleProviderChange}
          options={providers.map((p) => ({
            value: p.id,
            label: p.name,
          }))}
          placeholder="Select provider"
        />
        <Text className="text-xs text-muted-foreground">
          {providers.find((p) => p.id === formData.provider)?.description}
        </Text>
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Model</label>
        <Select
          value={formData.model}
          onValueChange={handleModelChange}
          options={providerModels.map((m) => ({
            value: m.id,
            label: `${m.name}${m.supportsThinking ? ' (Thinking)' : ''}`,
          }))}
          placeholder="Select model"
        />
        {currentModel && (
          <div className="space-y-1">
            <Text className="text-xs text-muted-foreground">
              Context: {(currentModel.contextWindow / 1000).toFixed(0)}K tokens
              • Max output: {(currentModel.maxOutputTokens / 1000).toFixed(0)}K
              tokens
            </Text>
            {currentModel.pricing && (
              <Text className="text-xs text-muted-foreground">
                Cost: ${currentModel.pricing.inputPricePerMillion.toFixed(2)}/1M
                input, ${currentModel.pricing.outputPricePerMillion.toFixed(2)}
                /1M output
              </Text>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
