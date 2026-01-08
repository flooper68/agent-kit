import { Input, Text } from '@agent-kit/ui';
import type { ProviderComponentProps } from '../registry';
import type { AnthropicThinkingConfig as AnthropicThinkingConfigType } from '../thinking-config-types';
import type { FieldError } from '../types';

// ============================================================================
// Constants
// ============================================================================

export const ANTHROPIC_CONSTANTS = {
  budgetMin: 1024,
  budgetMax: 32768,
  budgetDefault: 10000,
} as const;

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate Anthropic thinking configuration
 */
export function validateAnthropicConfig(
  config: AnthropicThinkingConfigType
): FieldError[] {
  const errors: FieldError[] = [];
  const { budgetTokens } = config;

  if (budgetTokens < ANTHROPIC_CONSTANTS.budgetMin) {
    errors.push({
      code: 'THINKING_BUDGET_OUT_OF_RANGE',
      field: 'budgetTokens',
      message: `Budget must be at least ${ANTHROPIC_CONSTANTS.budgetMin.toLocaleString()} tokens`,
      constraints: {
        min: ANTHROPIC_CONSTANTS.budgetMin,
        max: ANTHROPIC_CONSTANTS.budgetMax,
      },
    });
  } else if (budgetTokens > ANTHROPIC_CONSTANTS.budgetMax) {
    errors.push({
      code: 'THINKING_BUDGET_OUT_OF_RANGE',
      field: 'budgetTokens',
      message: `Budget cannot exceed ${ANTHROPIC_CONSTANTS.budgetMax.toLocaleString()} tokens`,
      constraints: {
        min: ANTHROPIC_CONSTANTS.budgetMin,
        max: ANTHROPIC_CONSTANTS.budgetMax,
      },
    });
  }

  return errors;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Anthropic-specific thinking configuration component.
 * Uses budget tokens (1024-32768) for extended thinking.
 */
export function AnthropicThinkingConfig({
  config,
  onChange,
  errors = [],
  onValidate,
}: ProviderComponentProps<AnthropicThinkingConfigType>) {
  const budgetError = errors.find((e) => e.field === 'budgetTokens')?.message;

  const handleChange = (value: string) => {
    const parsed = parseInt(value);
    const newValue = isNaN(parsed)
      ? ANTHROPIC_CONSTANTS.budgetDefault
      : parsed;
    const newConfig = { ...config, budgetTokens: newValue };
    onChange({ budgetTokens: newValue });

    if (onValidate) {
      const validationErrors = validateAnthropicConfig(newConfig);
      onValidate({
        isValid: validationErrors.length === 0,
        errors: validationErrors,
      });
    }
  };

  const handleBlur = () => {
    if (onValidate) {
      const validationErrors = validateAnthropicConfig(config);
      onValidate({
        isValid: validationErrors.length === 0,
        errors: validationErrors,
      });
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Budget Tokens</label>
      <Input
        type="number"
        min={ANTHROPIC_CONSTANTS.budgetMin}
        max={ANTHROPIC_CONSTANTS.budgetMax}
        value={config.budgetTokens}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        error={budgetError}
      />
      <Text className="text-xs text-muted-foreground">
        Token budget for thinking (1,024 - 32,768).
      </Text>
    </div>
  );
}
