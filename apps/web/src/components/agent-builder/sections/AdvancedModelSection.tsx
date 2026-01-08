import { useState, useCallback } from 'react';
import { Text, Input } from '@agent-kit/ui';
import type { AgentFormData, ModelInfo, ThinkingConfig } from '../types';
import { ThinkingConfigSwitch, type FieldError, getDefaultThinkingConfig } from '../providers';
import { toStoredThinkingConfig } from '../providers/thinking-config-types';

interface AdvancedModelSectionProps {
  formData: AgentFormData;
  onChange: (updates: Partial<AgentFormData>) => void;
  currentModel?: ModelInfo;
  onBlur?: () => void;
  onValidationChange?: (isValid: boolean) => void;
}

export function AdvancedModelSection({
  formData,
  onChange,
  currentModel,
  onBlur,
  onValidationChange,
}: AdvancedModelSectionProps) {
  const [thinkingErrors, setThinkingErrors] = useState<FieldError[]>([]);

  const handleThinkingChange = (enabled: boolean) => {
    if (!enabled) {
      onChange({ thinkingConfig: null });
      setThinkingErrors([]);
      onValidationChange?.(true);
    } else {
      // Use registry to get provider-specific defaults
      const discriminatedConfig = getDefaultThinkingConfig(
        formData.provider,
        currentModel
      );
      // Convert to legacy format for storage
      const defaultConfig = toStoredThinkingConfig(discriminatedConfig);
      onChange({ thinkingConfig: defaultConfig });
    }
    onBlur?.();
  };

  const updateThinkingConfig = useCallback(
    (updates: Partial<ThinkingConfig>) => {
      onChange({
        thinkingConfig: {
          ...formData.thinkingConfig,
          enabled: true,
          ...updates,
        },
      });
      onBlur?.();
    },
    [formData.thinkingConfig, onChange, onBlur]
  );

  const handleThinkingValidation = useCallback(
    (isValid: boolean, errors: FieldError[]) => {
      setThinkingErrors(errors);
      onValidationChange?.(isValid);
    },
    [onValidationChange]
  );

  return (
    <div className="space-y-6">
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
            onBlur={onBlur}
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
            onBlur={onBlur}
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
          onBlur={onBlur}
          placeholder={`Auto (max ${currentModel?.maxOutputTokens ?? 'N/A'})`}
        />
        <Text className="text-xs text-muted-foreground">
          Maximum tokens in the response. Leave empty for provider default.
        </Text>
      </div>

      {/* Max Context Tokens */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Max Context Tokens (optional)
        </label>
        <Input
          type="number"
          min="1000"
          max={currentModel?.contextWindow ?? 200000}
          value={formData.maxContextTokens ?? ''}
          onChange={(e) =>
            onChange({
              maxContextTokens: e.target.value ? parseInt(e.target.value) : null,
            })
          }
          onBlur={onBlur}
          placeholder={`Auto (max ${currentModel?.contextWindow ? (currentModel.contextWindow / 1000).toFixed(0) + 'K' : 'N/A'})`}
        />
        <Text className="text-xs text-muted-foreground">
          Maximum context window size for conversations. Set a lower limit to
          control costs. Leave empty to use the model default (
          {currentModel?.contextWindow
            ? (currentModel.contextWindow / 1000).toFixed(0) + 'K'
            : 'N/A'}
          ).
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
            <div className="ml-6">
              <ThinkingConfigSwitch
                provider={formData.provider}
                config={formData.thinkingConfig}
                onChange={updateThinkingConfig}
                currentModel={currentModel}
                errors={thinkingErrors}
                onValidationChange={handleThinkingValidation}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
