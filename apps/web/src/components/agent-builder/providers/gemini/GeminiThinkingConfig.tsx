import { Select, Text, Input } from '@agent-kit/ui';
import type { ProviderComponentProps } from '../registry';
import type {
  GeminiThinkingConfig as GeminiThinkingConfigType,
  GeminiLevelThinkingConfig,
  GeminiBudgetThinkingConfig,
} from '../thinking-config-types';
import type { FieldError } from '../types';

// ============================================================================
// Constants
// ============================================================================

export const GEMINI_CONSTANTS = {
  levelOptions: [
    { value: 'minimal', label: 'Minimal' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ] as const,
  levelDefault: 'low' as const,
  thinkingBudgetMin: 0,
  thinkingBudgetMax: 32768,
  thinkingBudgetDefault: 8192,
} as const;

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate Gemini thinking configuration (level mode)
 */
export function validateGeminiLevelConfig(
  config: GeminiLevelThinkingConfig,
  validThinkingLevels?: string[]
): FieldError[] {
  const errors: FieldError[] = [];

  if (
    validThinkingLevels &&
    !validThinkingLevels.includes(config.thinkingLevel)
  ) {
    errors.push({
      code: 'INVALID_THINKING_LEVEL',
      field: 'thinkingLevel',
      message: `This model only supports: ${validThinkingLevels.join(', ')}`,
      constraints: { allowed: validThinkingLevels },
    });
  }

  return errors;
}

/**
 * Validate Gemini thinking configuration (budget-legacy mode)
 */
export function validateGeminiBudgetConfig(
  config: GeminiBudgetThinkingConfig
): FieldError[] {
  const errors: FieldError[] = [];
  const { thinkingBudget } = config;

  // -1 is special value for "dynamic"
  if (thinkingBudget !== -1) {
    if (thinkingBudget < GEMINI_CONSTANTS.thinkingBudgetMin) {
      errors.push({
        code: 'THINKING_BUDGET_OUT_OF_RANGE',
        field: 'thinkingBudget',
        message: `Budget must be at least ${GEMINI_CONSTANTS.thinkingBudgetMin} tokens (or -1 for dynamic)`,
        constraints: {
          min: GEMINI_CONSTANTS.thinkingBudgetMin,
          max: GEMINI_CONSTANTS.thinkingBudgetMax,
        },
      });
    } else if (thinkingBudget > GEMINI_CONSTANTS.thinkingBudgetMax) {
      errors.push({
        code: 'THINKING_BUDGET_OUT_OF_RANGE',
        field: 'thinkingBudget',
        message: `Budget cannot exceed ${GEMINI_CONSTANTS.thinkingBudgetMax.toLocaleString()} tokens`,
        constraints: {
          min: GEMINI_CONSTANTS.thinkingBudgetMin,
          max: GEMINI_CONSTANTS.thinkingBudgetMax,
        },
      });
    }
  }

  return errors;
}

/**
 * Validate any Gemini thinking configuration
 */
export function validateGeminiConfig(
  config: GeminiThinkingConfigType,
  validThinkingLevels?: string[]
): FieldError[] {
  if (config.thinkingType === 'level') {
    return validateGeminiLevelConfig(config, validThinkingLevels);
  }
  return validateGeminiBudgetConfig(config);
}

// ============================================================================
// Component
// ============================================================================

interface GeminiThinkingConfigComponentProps
  extends ProviderComponentProps<GeminiThinkingConfigType> {
  /** Valid thinking levels for this model (from model constraints) */
  validThinkingLevels?: string[];
}

/**
 * Gemini-specific thinking configuration component.
 * Supports two modes based on config.thinkingType:
 * - 'level': Thinking level selection (Gemini 3 models)
 * - 'budget-legacy': Budget tokens (Gemini 2.5 models)
 */
export function GeminiThinkingConfig({
  config,
  onChange,
  errors = [],
  onValidate,
  modelInfo,
}: GeminiThinkingConfigComponentProps) {
  const levelError = errors.find((e) => e.field === 'thinkingLevel')?.message;
  const budgetError = errors.find((e) => e.field === 'thinkingBudget')?.message;
  const validThinkingLevels =
    modelInfo?.thinkingConstraints?.validThinkingLevels;

  const handleLevelChange = (value: string) => {
    const newLevel = value as 'minimal' | 'low' | 'medium' | 'high';
    const newConfig: GeminiLevelThinkingConfig = {
      ...config,
      thinkingType: 'level',
      thinkingLevel: newLevel,
    };
    onChange({ thinkingLevel: newLevel } as Partial<GeminiThinkingConfigType>);

    if (onValidate) {
      const validationErrors = validateGeminiLevelConfig(
        newConfig,
        validThinkingLevels
      );
      onValidate({
        isValid: validationErrors.length === 0,
        errors: validationErrors,
      });
    }
  };

  const handleBudgetChange = (value: string) => {
    const parsed = parseInt(value);
    const newBudget = isNaN(parsed)
      ? GEMINI_CONSTANTS.thinkingBudgetDefault
      : parsed;
    const newConfig: GeminiBudgetThinkingConfig = {
      ...config,
      thinkingType: 'budget-legacy',
      thinkingBudget: newBudget,
    };
    onChange({
      thinkingBudget: newBudget,
    } as Partial<GeminiThinkingConfigType>);

    if (onValidate) {
      const validationErrors = validateGeminiBudgetConfig(newConfig);
      onValidate({
        isValid: validationErrors.length === 0,
        errors: validationErrors,
      });
    }
  };

  // Level mode (Gemini 3 models)
  if (config.thinkingType === 'level') {
    // Filter options based on valid thinking levels for this model
    const filteredOptions = validThinkingLevels
      ? GEMINI_CONSTANTS.levelOptions.filter((opt) =>
          validThinkingLevels.includes(opt.value)
        )
      : [...GEMINI_CONSTANTS.levelOptions];

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">Thinking Level</label>
        <Select
          value={config.thinkingLevel}
          onValueChange={handleLevelChange}
          options={filteredOptions}
          variant={levelError ? 'error' : 'default'}
        />
        {levelError && (
          <Text className="text-sm text-destructive">{levelError}</Text>
        )}
        {validThinkingLevels && validThinkingLevels.length < 4 && (
          <Text className="text-xs text-muted-foreground">
            This model supports: {validThinkingLevels.join(', ')}
          </Text>
        )}
      </div>
    );
  }

  // Budget-legacy mode (Gemini 2.5 models)
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Thinking Budget</label>
      <Input
        type="number"
        min={-1}
        max={GEMINI_CONSTANTS.thinkingBudgetMax}
        value={config.thinkingBudget}
        onChange={(e) => handleBudgetChange(e.target.value)}
        error={budgetError}
      />
      <Text className="text-xs text-muted-foreground">
        Token budget for thinking (0 - 32,768, or -1 for dynamic).
      </Text>
    </div>
  );
}
