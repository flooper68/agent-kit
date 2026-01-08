import { Select, Text } from '@agent-kit/ui';
import type { ProviderComponentProps } from '../registry';
import type { OpenAIThinkingConfig as OpenAIThinkingConfigType } from '../thinking-config-types';
import type { FieldError } from '../types';

// ============================================================================
// Constants
// ============================================================================

export const OPENAI_CONSTANTS = {
  effortDefault: 'medium' as const,
  effortOptions: [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ] as const,
} as const;

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate OpenAI thinking configuration
 */
export function validateOpenAIConfig(
  config: OpenAIThinkingConfigType
): FieldError[] {
  const errors: FieldError[] = [];
  const validEfforts = ['low', 'medium', 'high'];

  if (!validEfforts.includes(config.reasoningEffort)) {
    errors.push({
      code: 'INVALID_REASONING_EFFORT',
      field: 'reasoningEffort',
      message: 'Invalid reasoning effort level',
      constraints: { allowed: validEfforts },
    });
  }

  return errors;
}

// ============================================================================
// Component
// ============================================================================

/**
 * OpenAI-specific thinking configuration component.
 * Uses reasoning effort levels (low/medium/high).
 *
 * Note: Currently most OpenAI models don't support thinking,
 * but this component is ready for when they do.
 */
export function OpenAIThinkingConfig({
  config,
  onChange,
  errors = [],
  onValidate,
}: ProviderComponentProps<OpenAIThinkingConfigType>) {
  const effortError = errors.find(
    (e) => e.field === 'reasoningEffort'
  )?.message;

  const handleChange = (value: string) => {
    const newEffort = value as 'low' | 'medium' | 'high';
    const newConfig = { ...config, reasoningEffort: newEffort };
    onChange({ reasoningEffort: newEffort });

    if (onValidate) {
      const validationErrors = validateOpenAIConfig(newConfig);
      onValidate({
        isValid: validationErrors.length === 0,
        errors: validationErrors,
      });
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Reasoning Effort</label>
      <Select
        value={config.reasoningEffort}
        onValueChange={handleChange}
        options={[...OPENAI_CONSTANTS.effortOptions]}
        variant={effortError ? 'error' : 'default'}
      />
      {effortError && (
        <Text className="text-sm text-destructive">{effortError}</Text>
      )}
      <Text className="text-xs text-muted-foreground">
        Controls how much effort the model puts into reasoning.
      </Text>
    </div>
  );
}
