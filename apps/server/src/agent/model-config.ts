/**
 * Model configuration constants for the Agent Builder.
 * Defines available providers, models, and their capabilities.
 */

import type { ThinkingConfig } from '../db/schema/agents';
import { MODEL_PRICING, type ModelPricing } from '../features/agents/pricing';

export const PROVIDERS = ['anthropic', 'openai', 'gemini'] as const;
export type Provider = (typeof PROVIDERS)[number];

export type ThinkingType = 'budget' | 'level';

export type ThinkingLevel = 'minimal' | 'low' | 'medium' | 'high';

export type ReasoningEffort = 'low' | 'medium' | 'high';

export interface ThinkingConstraints {
  // Anthropic: budget token range
  minBudgetTokens?: number;
  maxBudgetTokens?: number;
  // Gemini: valid thinking levels for this model
  validThinkingLevels?: ThinkingLevel[];
  // OpenAI: valid reasoning efforts
  validReasoningEfforts?: ReasoningEffort[];
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: Provider;
  contextWindow: number;
  maxOutputTokens: number;
  costTier: 1 | 2 | 3; // 1 = cheapest, 3 = most expensive
  deprecated?: boolean;

  // Thinking/Reasoning
  supportsThinking: boolean;
  thinkingType?: ThinkingType;
  thinkingConstraints?: ThinkingConstraints;

  // Capabilities
  supportsVision: boolean;
  supportsStructuredOutput: boolean;
  supportsPdf: boolean;
  supportsAudio: boolean;
  supportsToolUse: boolean;
  supportsPromptCaching: boolean;
  supportsWebSearch: boolean;
  maxTools?: number; // If there's a limit
}

export interface ProviderInfo {
  id: Provider;
  name: string;
  description: string;
}

// Provider metadata
export const PROVIDER_INFO: Record<Provider, ProviderInfo> = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models with extended thinking support',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-5 series models',
  },
  gemini: {
    id: 'gemini',
    name: 'Google',
    description: 'Gemini 3 models with thinking support',
  },
};

// All available models
export const MODELS: Record<string, ModelInfo> = {
  // Anthropic Models (newest first)
  'claude-opus-4-5-20251101': {
    id: 'claude-opus-4-5-20251101',
    name: 'Claude Opus 4.5',
    provider: 'anthropic',
    supportsThinking: true,
    thinkingType: 'budget',
    thinkingConstraints: {
      minBudgetTokens: 1024,
      maxBudgetTokens: 32768,
    },
    contextWindow: 200000,
    maxOutputTokens: 64000,
    costTier: 3,
    supportsVision: true,
    supportsStructuredOutput: true,
    supportsPdf: true,
    supportsAudio: false,
    supportsToolUse: true,
    supportsPromptCaching: true,
    supportsWebSearch: true,
  },
  'claude-sonnet-4-5-20250929': {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    supportsThinking: true,
    thinkingType: 'budget',
    thinkingConstraints: {
      minBudgetTokens: 1024,
      maxBudgetTokens: 32768,
    },
    contextWindow: 200000,
    maxOutputTokens: 64000,
    costTier: 2,
    supportsVision: true,
    supportsStructuredOutput: true,
    supportsPdf: true,
    supportsAudio: false,
    supportsToolUse: true,
    supportsPromptCaching: true,
    supportsWebSearch: true,
  },
  'claude-haiku-4-5-20251001': {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    supportsThinking: true,
    thinkingType: 'budget',
    thinkingConstraints: {
      minBudgetTokens: 1024,
      maxBudgetTokens: 32768,
    },
    contextWindow: 200000,
    maxOutputTokens: 64000,
    costTier: 1,
    supportsVision: true,
    supportsStructuredOutput: true,
    supportsPdf: true,
    supportsAudio: false,
    supportsToolUse: true,
    supportsPromptCaching: true,
    supportsWebSearch: true,
  },
  'claude-sonnet-4-20250514': {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    supportsThinking: true,
    thinkingType: 'budget',
    thinkingConstraints: {
      minBudgetTokens: 1024,
      maxBudgetTokens: 32768,
    },
    contextWindow: 200000,
    maxOutputTokens: 8192,
    costTier: 2,
    supportsVision: true,
    supportsStructuredOutput: true,
    supportsPdf: true,
    supportsAudio: false,
    supportsToolUse: true,
    supportsPromptCaching: true,
    supportsWebSearch: true,
  },

  // OpenAI Models (newest first)
  // Note: OpenAI models currently do not support extended thinking
  'gpt-5.2': {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    provider: 'openai',
    supportsThinking: false,
    contextWindow: 400000,
    maxOutputTokens: 128000,
    costTier: 3,
    supportsVision: true,
    supportsStructuredOutput: true,
    supportsPdf: false,
    supportsAudio: true,
    supportsToolUse: true,
    supportsPromptCaching: false,
    supportsWebSearch: true,
  },
  'gpt-5.2-codex': {
    id: 'gpt-5.2-codex',
    name: 'GPT-5.2 Codex',
    provider: 'openai',
    supportsThinking: false,
    contextWindow: 400000,
    maxOutputTokens: 128000,
    costTier: 3,
    supportsVision: true,
    supportsStructuredOutput: true,
    supportsPdf: false,
    supportsAudio: true,
    supportsToolUse: true,
    supportsPromptCaching: false,
    supportsWebSearch: true,
  },
  'gpt-5': {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    supportsThinking: false,
    contextWindow: 400000,
    maxOutputTokens: 128000,
    costTier: 3,
    supportsVision: true,
    supportsStructuredOutput: true,
    supportsPdf: false,
    supportsAudio: true,
    supportsToolUse: true,
    supportsPromptCaching: false,
    supportsWebSearch: true,
  },
  'gpt-5-mini': {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    supportsThinking: false,
    contextWindow: 200000,
    maxOutputTokens: 64000,
    costTier: 2,
    supportsVision: true,
    supportsStructuredOutput: true,
    supportsPdf: false,
    supportsAudio: true,
    supportsToolUse: true,
    supportsPromptCaching: false,
    supportsWebSearch: true,
  },

  // Gemini Models (newest first)
  // Note: Gemini 3 Pro only supports 'low' and 'high' thinking levels
  // Gemini 3 Flash supports all levels: 'minimal', 'low', 'medium', 'high'
  'gemini-3-pro-preview': {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    provider: 'gemini',
    supportsThinking: true,
    thinkingType: 'level',
    thinkingConstraints: {
      validThinkingLevels: ['low', 'high'],
    },
    contextWindow: 1000000,
    maxOutputTokens: 64000,
    costTier: 3,
    supportsVision: true,
    supportsStructuredOutput: true,
    supportsPdf: true,
    supportsAudio: true,
    supportsToolUse: true,
    supportsPromptCaching: true,
    supportsWebSearch: true,
  },
  'gemini-3-flash-preview': {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    provider: 'gemini',
    supportsThinking: true,
    thinkingType: 'level',
    thinkingConstraints: {
      validThinkingLevels: ['minimal', 'low', 'medium', 'high'],
    },
    contextWindow: 1000000,
    maxOutputTokens: 64000,
    costTier: 2,
    supportsVision: true,
    supportsStructuredOutput: true,
    supportsPdf: true,
    supportsAudio: true,
    supportsToolUse: true,
    supportsPromptCaching: true,
    supportsWebSearch: true,
  },
};

// Default thinking configuration per provider/thinking type
export const DEFAULT_THINKING_CONFIG = {
  // Anthropic: budget in tokens (1024-32768)
  budget: {
    enabled: true,
    budgetTokens: 10000,
  },
  // Gemini 3: thinking level
  level: {
    enabled: true,
    thinkingLevel: 'low' as const, // Safe default that works for both Pro and Flash
  },
};

/**
 * Get all models for a specific provider
 */
export function getModelsForProvider(provider: Provider): ModelInfo[] {
  return Object.values(MODELS).filter(
    (model) => model.provider === provider && !model.deprecated
  );
}

/**
 * Get model information by ID
 */
export function getModelInfo(modelId: string): ModelInfo | undefined {
  return MODELS[modelId];
}

/**
 * Validate that a model belongs to a provider
 */
export function validateModelProvider(
  modelId: string,
  provider: Provider
): boolean {
  const model = MODELS[modelId];
  return model?.provider === provider;
}

/**
 * Get the default model for a provider
 */
export function getDefaultModelForProvider(provider: Provider): string {
  switch (provider) {
    case 'anthropic':
      return 'claude-sonnet-4-5-20250929';
    case 'openai':
      return 'gpt-5-mini';
    case 'gemini':
      return 'gemini-3-flash-preview';
  }
}

/**
 * Get all providers
 */
export function getProviders(): ProviderInfo[] {
  return Object.values(PROVIDER_INFO);
}

/**
 * Validate that an agent's configuration is compatible with the selected model
 */
export function validateAgentConfig(
  modelId: string,
  config: {
    tools?: string[];
    thinkingConfig?: ThinkingConfig;
    maxOutputTokens?: number;
  }
): { valid: boolean; warnings: string[] } {
  const model = MODELS[modelId];
  const warnings: string[] = [];

  if (!model) {
    return { valid: false, warnings: ['Unknown model'] };
  }

  // Check thinking config compatibility
  if (config.thinkingConfig?.enabled && !model.supportsThinking) {
    warnings.push(`Model ${model.name} does not support thinking/reasoning`);
  }

  // Check thinking level for Gemini
  if (
    config.thinkingConfig?.thinkingLevel &&
    model.thinkingConstraints?.validThinkingLevels
  ) {
    if (
      !model.thinkingConstraints.validThinkingLevels.includes(
        config.thinkingConfig.thinkingLevel
      )
    ) {
      warnings.push(
        `Model ${model.name} only supports thinking levels: ${model.thinkingConstraints.validThinkingLevels.join(', ')}`
      );
    }
  }

  // Check budget tokens for Anthropic
  if (config.thinkingConfig?.budgetTokens && model.thinkingConstraints) {
    const { minBudgetTokens, maxBudgetTokens } = model.thinkingConstraints;
    if (
      minBudgetTokens !== undefined &&
      config.thinkingConfig.budgetTokens < minBudgetTokens
    ) {
      warnings.push(
        `Budget tokens ${config.thinkingConfig.budgetTokens} is below minimum ${minBudgetTokens}`
      );
    }
    if (
      maxBudgetTokens !== undefined &&
      config.thinkingConfig.budgetTokens > maxBudgetTokens
    ) {
      warnings.push(
        `Budget tokens ${config.thinkingConfig.budgetTokens} exceeds maximum ${maxBudgetTokens}`
      );
    }
  }

  // Check max output tokens
  if (config.maxOutputTokens && config.maxOutputTokens > model.maxOutputTokens) {
    warnings.push(
      `Requested ${config.maxOutputTokens} tokens exceeds model max of ${model.maxOutputTokens}`
    );
  }

  return { valid: true, warnings };
}

/**
 * Get pricing information for a model
 */
export function getModelPricing(modelId: string): ModelPricing | undefined {
  return MODEL_PRICING[modelId];
}

/**
 * Model info with pricing - combines ModelInfo with pricing data
 */
export interface ModelInfoWithPricing extends ModelInfo {
  pricing?: ModelPricing;
}

/**
 * Get model information with pricing by ID
 */
export function getModelInfoWithPricing(
  modelId: string
): ModelInfoWithPricing | undefined {
  const modelInfo = MODELS[modelId];
  if (!modelInfo) return undefined;

  return {
    ...modelInfo,
    pricing: MODEL_PRICING[modelId],
  };
}

/**
 * Get all models for a provider with pricing info
 */
export function getModelsForProviderWithPricing(
  provider: Provider
): ModelInfoWithPricing[] {
  return Object.values(MODELS)
    .filter((model) => model.provider === provider && !model.deprecated)
    .map((model) => ({
      ...model,
      pricing: MODEL_PRICING[model.id],
    }));
}
