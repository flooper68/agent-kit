/**
 * Types for provider-specific thinking configuration components.
 */

import type { ThinkingConfig, ModelInfo } from '../types';

/**
 * Field-level validation error for inline display
 */
export interface FieldError {
  code: string;
  field: string;
  message: string;
  suggestion?: string;
  constraints?: {
    min?: number;
    max?: number;
    allowed?: string[];
  };
}

/**
 * Validation result from provider components
 */
export interface ValidationResult {
  isValid: boolean;
  errors: FieldError[];
}

/**
 * Base props for all provider thinking config components
 */
export interface BaseThinkingConfigProps {
  config: ThinkingConfig;
  onChange: (updates: Partial<ThinkingConfig>) => void;
  errors?: FieldError[];
  onValidate?: (result: ValidationResult) => void;
}

/**
 * Anthropic-specific thinking config props.
 * Budget token constraints (1024-32768).
 */
export type AnthropicThinkingConfigProps = BaseThinkingConfigProps;

/**
 * OpenAI-specific thinking config props.
 * Reasoning effort options (low/medium/high).
 */
export type OpenAIThinkingConfigProps = BaseThinkingConfigProps;

/**
 * Gemini-specific thinking config props
 */
export interface GeminiThinkingConfigProps extends BaseThinkingConfigProps {
  /** The thinking type determines which UI to show */
  thinkingType?: 'level' | 'budget-legacy';
  /** Valid thinking levels for this model (e.g., Pro only supports low/high) */
  validThinkingLevels?: string[];
}

/**
 * Props for the ThinkingConfigSwitch wrapper component
 */
export interface ThinkingConfigSwitchProps {
  provider: 'anthropic' | 'openai' | 'gemini';
  config: ThinkingConfig;
  onChange: (updates: Partial<ThinkingConfig>) => void;
  currentModel?: ModelInfo;
  errors?: FieldError[];
  onValidationChange?: (isValid: boolean, errors: FieldError[]) => void;
}

/**
 * Form-level errors structure from TRPC validation
 */
export interface AgentFormErrors {
  general?: string;
  fields: Record<string, FieldError[]>;
}
