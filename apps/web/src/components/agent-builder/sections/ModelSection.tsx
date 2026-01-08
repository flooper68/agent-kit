import { Select, Text, Input } from '@agent-kit/ui';
import type {
  AgentFormData,
  ModelInfo,
  ProviderInfo,
  ThinkingConfig,
} from '../types';

interface ModelSectionProps {
  formData: AgentFormData;
  onChange: (updates: Partial<AgentFormData>) => void;
  providers: ProviderInfo[];
  models: ModelInfo[];
  currentModel?: ModelInfo;
}

export function ModelSection({
  formData,
  onChange,
  providers,
  models,
  currentModel,
}: ModelSectionProps) {
  const providerModels = models.filter((m) => m.provider === formData.provider);

  const handleProviderChange = (provider: string) => {
    onChange({ provider: provider as AgentFormData['provider'] });
  };

  const handleThinkingChange = (enabled: boolean) => {
    if (!enabled) {
      onChange({ thinkingConfig: null });
    } else {
      // Set default thinking config based on provider
      const defaultConfig: ThinkingConfig = { enabled: true };
      if (formData.provider === 'anthropic') {
        defaultConfig.budgetTokens = 10000;
      } else if (formData.provider === 'openai') {
        defaultConfig.reasoningEffort = 'medium';
      } else if (formData.provider === 'gemini') {
        if (currentModel?.thinkingType === 'level') {
          defaultConfig.thinkingLevel = 'medium';
        } else {
          defaultConfig.thinkingBudget = 8192;
        }
      }
      onChange({ thinkingConfig: defaultConfig });
    }
  };

  const updateThinkingConfig = (updates: Partial<ThinkingConfig>) => {
    onChange({
      thinkingConfig: {
        ...formData.thinkingConfig,
        enabled: true,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-6">
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
          onValueChange={(model) => onChange({ model })}
          options={providerModels.map((m) => ({
            value: m.id,
            label: `${m.name}${m.supportsThinking ? ' (Thinking)' : ''}`,
          }))}
          placeholder="Select model"
        />
        {currentModel && (
          <Text className="text-xs text-muted-foreground">
            Context: {(currentModel.contextWindow / 1000).toFixed(0)}K tokens •
            Max output: {(currentModel.maxOutputTokens / 1000).toFixed(0)}K
            tokens
          </Text>
        )}
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Temperature (optional)</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={formData.temperature ?? 1}
            onChange={(e) =>
              onChange({ temperature: parseFloat(e.target.value) })
            }
            className="flex-1"
          />
          <Input
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={formData.temperature ?? ''}
            onChange={(e) =>
              onChange({
                temperature: e.target.value ? parseFloat(e.target.value) : null,
              })
            }
            className="w-20"
            placeholder="Auto"
          />
        </div>
        <Text className="text-xs text-muted-foreground">
          Controls randomness. Lower = more focused, higher = more creative.
          Leave empty for provider default.
        </Text>
      </div>

      {/* Max Output Tokens */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Max Output Tokens (optional)
        </label>
        <Input
          type="number"
          min="1"
          max={currentModel?.maxOutputTokens ?? 100000}
          value={formData.maxOutputTokens ?? ''}
          onChange={(e) =>
            onChange({
              maxOutputTokens: e.target.value ? parseInt(e.target.value) : null,
            })
          }
          placeholder={`Auto (max ${currentModel?.maxOutputTokens ?? 'N/A'})`}
        />
        <Text className="text-xs text-muted-foreground">
          Maximum tokens in the response. Leave empty for provider default.
        </Text>
      </div>

      {/* Thinking/Reasoning Configuration */}
      {currentModel?.supportsThinking && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="thinkingEnabled"
              checked={formData.thinkingConfig?.enabled ?? false}
              onChange={(e) => handleThinkingChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="thinkingEnabled" className="text-sm font-medium">
              Enable Extended Thinking
            </label>
          </div>

          {formData.thinkingConfig?.enabled && (
            <div className="space-y-4 ml-6">
              {/* Anthropic: Budget Tokens */}
              {formData.provider === 'anthropic' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget Tokens</label>
                  <Input
                    type="number"
                    min="1024"
                    max="32768"
                    value={formData.thinkingConfig.budgetTokens ?? 10000}
                    onChange={(e) =>
                      updateThinkingConfig({
                        budgetTokens: parseInt(e.target.value),
                      })
                    }
                  />
                  <Text className="text-xs text-muted-foreground">
                    Token budget for thinking (1,024 - 32,768).
                  </Text>
                </div>
              )}

              {/* OpenAI: Reasoning Effort */}
              {formData.provider === 'openai' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Reasoning Effort
                  </label>
                  <Select
                    value={formData.thinkingConfig.reasoningEffort ?? 'medium'}
                    onValueChange={(value) =>
                      updateThinkingConfig({
                        reasoningEffort: value as 'low' | 'medium' | 'high',
                      })
                    }
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                    ]}
                  />
                </div>
              )}

              {/* Gemini: Thinking Level or Budget */}
              {formData.provider === 'gemini' &&
                currentModel.thinkingType === 'level' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Thinking Level
                    </label>
                    <Select
                      value={formData.thinkingConfig.thinkingLevel ?? 'medium'}
                      onValueChange={(value) =>
                        updateThinkingConfig({
                          thinkingLevel: value as
                            | 'minimal'
                            | 'low'
                            | 'medium'
                            | 'high',
                        })
                      }
                      options={[
                        { value: 'minimal', label: 'Minimal' },
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' },
                      ]}
                    />
                  </div>
                )}

              {formData.provider === 'gemini' &&
                currentModel.thinkingType === 'budget-legacy' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Thinking Budget
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="32768"
                      value={formData.thinkingConfig.thinkingBudget ?? 8192}
                      onChange={(e) =>
                        updateThinkingConfig({
                          thinkingBudget: parseInt(e.target.value),
                        })
                      }
                    />
                    <Text className="text-xs text-muted-foreground">
                      Token budget for thinking (0 - 32,768, or -1 for dynamic).
                    </Text>
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
