/**
 * Discriminated union types for provider-specific thinking configurations.
 * Each provider variant carries only the fields relevant to that provider.
 */

// ============================================================================
// Provider-Specific Thinking Config Types
// ============================================================================

/**
 * Anthropic thinking config uses budget tokens (1024-32768)
 */
export interface AnthropicThinkingConfig {
  provider: 'anthropic';
  enabled: boolean;
  budgetTokens: number;
}

/**
 * OpenAI thinking config uses reasoning effort levels
 */
export interface OpenAIThinkingConfig {
  provider: 'openai';
  enabled: boolean;
  reasoningEffort: 'low' | 'medium' | 'high';
}

/**
 * Gemini thinking config with level-based thinking (Gemini 3 models)
 */
export interface GeminiLevelThinkingConfig {
  provider: 'gemini';
  thinkingType: 'level';
  enabled: boolean;
  thinkingLevel: 'minimal' | 'low' | 'medium' | 'high';
}

/**
 * Gemini thinking config with budget-based thinking (Gemini 2.5 legacy models)
 */
export interface GeminiBudgetThinkingConfig {
  provider: 'gemini';
  thinkingType: 'budget-legacy';
  enabled: boolean;
  thinkingBudget: number;
}

/**
 * Union of all Gemini thinking config variants
 */
export type GeminiThinkingConfig =
  | GeminiLevelThinkingConfig
  | GeminiBudgetThinkingConfig;

/**
 * Discriminated union of all provider thinking configs.
 * Use the `provider` field (and `thinkingType` for Gemini) to narrow the type.
 */
export type ThinkingConfig =
  | AnthropicThinkingConfig
  | OpenAIThinkingConfig
  | GeminiLevelThinkingConfig
  | GeminiBudgetThinkingConfig;

// ============================================================================
// Type Guards
// ============================================================================

export function isAnthropicConfig(
  config: ThinkingConfig
): config is AnthropicThinkingConfig {
  return config.provider === 'anthropic';
}

export function isOpenAIConfig(
  config: ThinkingConfig
): config is OpenAIThinkingConfig {
  return config.provider === 'openai';
}

export function isGeminiConfig(
  config: ThinkingConfig
): config is GeminiThinkingConfig {
  return config.provider === 'gemini';
}

export function isGeminiLevelConfig(
  config: ThinkingConfig
): config is GeminiLevelThinkingConfig {
  return config.provider === 'gemini' && config.thinkingType === 'level';
}

export function isGeminiBudgetConfig(
  config: ThinkingConfig
): config is GeminiBudgetThinkingConfig {
  return (
    config.provider === 'gemini' && config.thinkingType === 'budget-legacy'
  );
}

// ============================================================================
// Storage Format (for DB compatibility)
// ============================================================================

/**
 * Flat storage format used in the database.
 * All provider fields are optional since the provider is known from the agent record.
 */
export interface StoredThinkingConfig {
  enabled: boolean;
  budgetTokens?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
  thinkingLevel?: 'minimal' | 'low' | 'medium' | 'high';
  thinkingBudget?: number;
}

/**
 * Convert discriminated union to flat storage format
 */
export function toStoredThinkingConfig(
  config: ThinkingConfig
): StoredThinkingConfig {
  const stored: StoredThinkingConfig = { enabled: config.enabled };

  if (isAnthropicConfig(config)) {
    stored.budgetTokens = config.budgetTokens;
  } else if (isOpenAIConfig(config)) {
    stored.reasoningEffort = config.reasoningEffort;
  } else if (isGeminiLevelConfig(config)) {
    stored.thinkingLevel = config.thinkingLevel;
  } else if (isGeminiBudgetConfig(config)) {
    stored.thinkingBudget = config.thinkingBudget;
  }

  return stored;
}

/**
 * Convert flat storage format to discriminated union.
 * Requires the provider and optionally thinkingType from model info.
 */
export function fromStoredThinkingConfig(
  stored: StoredThinkingConfig | null,
  provider: 'anthropic' | 'openai' | 'gemini',
  thinkingType?: 'level' | 'budget-legacy'
): ThinkingConfig | null {
  if (!stored) return null;

  switch (provider) {
    case 'anthropic':
      return {
        provider: 'anthropic',
        enabled: stored.enabled,
        budgetTokens: stored.budgetTokens ?? 10000,
      };

    case 'openai':
      return {
        provider: 'openai',
        enabled: stored.enabled,
        reasoningEffort: stored.reasoningEffort ?? 'medium',
      };

    case 'gemini':
      if (thinkingType === 'level') {
        return {
          provider: 'gemini',
          thinkingType: 'level',
          enabled: stored.enabled,
          thinkingLevel: stored.thinkingLevel ?? 'low',
        };
      }
      return {
        provider: 'gemini',
        thinkingType: 'budget-legacy',
        enabled: stored.enabled,
        thinkingBudget: stored.thinkingBudget ?? 8192,
      };
  }
}
