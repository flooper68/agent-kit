import { useCallback, useState, useMemo } from 'react';
import type { ThinkingConfigSwitchProps, FieldError, ValidationResult } from './types';
import type { ThinkingConfig as LegacyThinkingConfig, ModelInfo } from '../types';
import { getProvider, validateThinkingConfigFromRegistry } from './registry';
import type { ThinkingConfig } from './thinking-config-types';
import { fromStoredThinkingConfig } from './thinking-config-types';

/**
 * Wrapper component that switches between provider-specific thinking config components.
 * Uses the provider registry for component lookup.
 */
export function ThinkingConfigSwitch({
  provider: providerId,
  config: legacyConfig,
  onChange: legacyOnChange,
  currentModel,
  errors: externalErrors,
  onValidationChange,
}: ThinkingConfigSwitchProps) {
  const [internalErrors, setInternalErrors] = useState<FieldError[]>([]);

  // Use external errors if provided, otherwise use internal
  const errors = externalErrors ?? internalErrors;

  // Get the provider from registry
  const provider = getProvider(providerId);

  // Convert legacy config to discriminated union type
  const config = useMemo<ThinkingConfig | null>(() => {
    if (!legacyConfig) return null;
    return fromStoredThinkingConfig(
      legacyConfig,
      providerId,
      currentModel?.thinkingType as 'level' | 'budget-legacy' | undefined
    );
  }, [legacyConfig, providerId, currentModel?.thinkingType]);

  // Adapt onChange to work with both legacy and new types
  const onChange = useCallback(
    (updates: Partial<ThinkingConfig>) => {
      // Pass through the partial updates - they're compatible
      legacyOnChange(updates as Partial<LegacyThinkingConfig>);
    },
    [legacyOnChange]
  );

  const handleValidate = useCallback(
    (result: ValidationResult) => {
      setInternalErrors(result.errors);
      onValidationChange?.(result.isValid, result.errors);
    },
    [onValidationChange]
  );

  if (!provider || !config) {
    return null;
  }

  const Component = provider.Component;

  return (
    <Component
      config={config}
      onChange={onChange}
      errors={errors}
      onValidate={handleValidate}
      modelInfo={currentModel}
    />
  );
}

/**
 * Validate thinking config for any provider.
 * Used during form submission to ensure all fields are valid.
 */
export function validateThinkingConfig(
  providerId: string,
  legacyConfig: LegacyThinkingConfig,
  currentModel?: ModelInfo
): FieldError[] {
  const config = fromStoredThinkingConfig(
    legacyConfig,
    providerId as 'anthropic' | 'openai' | 'gemini',
    currentModel?.thinkingType as 'level' | 'budget-legacy' | undefined
  );

  if (!config) {
    return [];
  }

  return validateThinkingConfigFromRegistry(config, currentModel);
}
