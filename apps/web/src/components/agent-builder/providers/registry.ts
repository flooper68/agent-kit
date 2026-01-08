/**
 * Provider registry for thinking configuration.
 * Centralizes all provider-specific logic: defaults, validation, and components.
 */

import type { ComponentType } from 'react';
import type { ModelInfo } from '../types';
import type { FieldError, ValidationResult } from './types';
import type { ThinkingConfig } from './thinking-config-types';

// ============================================================================
// Provider Interface
// ============================================================================

/**
 * Props passed to provider thinking config components
 */
export interface ProviderComponentProps<
  T extends ThinkingConfig = ThinkingConfig,
> {
  config: T;
  onChange: (updates: Partial<T>) => void;
  errors?: FieldError[];
  onValidate?: (result: ValidationResult) => void;
  modelInfo?: ModelInfo;
}

/**
 * Provider constants for UI and validation
 */
export interface ProviderConstants {
  // Anthropic
  budgetMin?: number;
  budgetMax?: number;
  budgetDefault?: number;

  // OpenAI
  effortOptions?: ReadonlyArray<{ value: string; label: string }>;
  effortDefault?: 'low' | 'medium' | 'high';

  // Gemini
  levelOptions?: ReadonlyArray<{ value: string; label: string }>;
  levelDefault?: 'minimal' | 'low' | 'medium' | 'high';
  thinkingBudgetMin?: number;
  thinkingBudgetMax?: number;
  thinkingBudgetDefault?: number;
}

/**
 * Interface that each provider module must implement.
 * Encapsulates all provider-specific logic in one place.
 */
export interface ThinkingConfigProvider<
  T extends ThinkingConfig = ThinkingConfig,
> {
  /** Provider identifier */
  readonly id: 'anthropic' | 'openai' | 'gemini';

  /** Constants for UI and validation */
  readonly constants: ProviderConstants;

  /** Create default config when thinking is enabled */
  createDefaultConfig(modelInfo?: ModelInfo): T;

  /** Validate config and return field-level errors */
  validate(config: T, modelInfo?: ModelInfo): FieldError[];

  /** React component for rendering the config UI */
  Component: ComponentType<ProviderComponentProps<T>>;
}

// ============================================================================
// Provider Registry
// ============================================================================

// Import providers
import { anthropicProvider } from './anthropic';
import { openaiProvider } from './openai';
import { geminiProvider } from './gemini';

/**
 * Registry of all available providers.
 * We use `unknown` for the generic type to avoid variance issues,
 * then cast appropriately when retrieving providers.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PROVIDER_REGISTRY: Record<string, ThinkingConfigProvider<any>> = {
  anthropic: anthropicProvider,
  openai: openaiProvider,
  gemini: geminiProvider,
};

/**
 * Get a provider by ID. Returns undefined if provider not found.
 * The returned provider is typed generically since the exact type
 * depends on the provider ID.
 */
export function getProvider(
  providerId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ThinkingConfigProvider<any> | undefined {
  return PROVIDER_REGISTRY[providerId];
}

/**
 * Get the default thinking config for a provider.
 * Used when enabling thinking for the first time.
 */
export function getDefaultThinkingConfig(
  providerId: string,
  modelInfo?: ModelInfo
): ThinkingConfig {
  const provider = getProvider(providerId);
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }
  return provider.createDefaultConfig(modelInfo);
}

/**
 * Validate a thinking config.
 * Delegates to the appropriate provider's validation function.
 */
export function validateThinkingConfigFromRegistry(
  config: ThinkingConfig,
  modelInfo?: ModelInfo
): FieldError[] {
  const provider = getProvider(config.provider);
  if (!provider) {
    return [
      {
        code: 'UNKNOWN_PROVIDER',
        field: 'provider',
        message: `Unknown provider: ${config.provider}`,
      },
    ];
  }
  return provider.validate(config, modelInfo);
}
