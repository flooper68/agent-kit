/**
 * Comprehensive validation for agent configurations.
 * Returns structured field-level errors for frontend display.
 */

import {
  getModelInfo,
  type Provider,
  type ThinkingLevel,
} from '../providers/model-config';
import { listToolIds, listActionIds } from '../tools';
import type { ThinkingConfig } from '../../db/schema/agents';
import type { ValidationResult, ValidationFieldError } from './types';

export interface AgentConfigToValidate {
  provider?: Provider;
  model?: string;
  tools?: string[];
  thinkingConfig?: ThinkingConfig | null;
  maxOutputTokens?: number | null;
  maxContextTokens?: number | null;
}

/**
 * Validate agent configuration against model capabilities.
 * Returns structured errors for frontend inline display.
 */
export function validateAgentConfiguration(
  config: AgentConfigToValidate
): ValidationResult {
  const errors: ValidationFieldError[] = [];

  // 1. Validate model exists
  const modelInfo = config.model ? getModelInfo(config.model) : undefined;
  if (config.model && !modelInfo) {
    errors.push({
      code: 'UNKNOWN_MODEL',
      field: 'model',
      message: `Unknown model: ${config.model}`,
      suggestion: 'Select a model from the available options',
    });
    // Early return - can't validate further without model info
    return { valid: false, errors };
  }

  // 2. Validate model belongs to provider
  if (modelInfo && config.provider && modelInfo.provider !== config.provider) {
    errors.push({
      code: 'MODEL_PROVIDER_MISMATCH',
      field: 'model',
      message: `Model ${modelInfo.name} belongs to ${modelInfo.provider}, not ${config.provider}`,
      suggestion: `Change provider to ${modelInfo.provider} or select a different model`,
    });
  }

  // 3. Validate tools (includes both tools and actions)
  if (config.tools && config.tools.length > 0) {
    const validToolIds = [...listToolIds(), ...listActionIds()];
    const invalidTools = config.tools.filter((t) => !validToolIds.includes(t));
    if (invalidTools.length > 0) {
      errors.push({
        code: 'INVALID_TOOLS',
        field: 'tools',
        message: `Invalid tool IDs: ${invalidTools.join(', ')}`,
        suggestion: 'Remove invalid tools from selection',
      });
    }

    // Check web search capability if webSearch tool is selected
    if (
      config.tools.includes('webSearch') &&
      modelInfo &&
      !modelInfo.supportsWebSearch
    ) {
      errors.push({
        code: 'WEB_SEARCH_NOT_SUPPORTED',
        field: 'tools',
        message: `${modelInfo.name} does not support web search`,
        suggestion: 'Remove web search tool or select a model that supports it',
      });
    }
  }

  // 4. Validate thinking configuration
  if (config.thinkingConfig?.enabled && modelInfo) {
    if (!modelInfo.supportsThinking) {
      errors.push({
        code: 'THINKING_NOT_SUPPORTED',
        field: 'thinkingConfig.enabled',
        message: `${modelInfo.name} does not support extended thinking`,
        suggestion: 'Disable thinking or select a model that supports it',
      });
    } else {
      const constraints = modelInfo.thinkingConstraints;

      // Validate budget tokens (Anthropic)
      if (config.thinkingConfig.budgetTokens !== undefined && constraints) {
        const budget = config.thinkingConfig.budgetTokens;

        if (
          constraints.minBudgetTokens !== undefined &&
          budget < constraints.minBudgetTokens
        ) {
          errors.push({
            code: 'THINKING_BUDGET_OUT_OF_RANGE',
            field: 'thinkingConfig.budgetTokens',
            message: `Budget tokens ${budget.toLocaleString()} is below minimum ${constraints.minBudgetTokens.toLocaleString()}`,
            suggestion: `Set budget tokens to at least ${constraints.minBudgetTokens.toLocaleString()}`,
            constraints: {
              min: constraints.minBudgetTokens,
              max: constraints.maxBudgetTokens,
            },
          });
        }

        if (
          constraints.maxBudgetTokens !== undefined &&
          budget > constraints.maxBudgetTokens
        ) {
          errors.push({
            code: 'THINKING_BUDGET_OUT_OF_RANGE',
            field: 'thinkingConfig.budgetTokens',
            message: `Budget tokens ${budget.toLocaleString()} exceeds maximum ${constraints.maxBudgetTokens.toLocaleString()}`,
            suggestion: `Set budget tokens to at most ${constraints.maxBudgetTokens.toLocaleString()}`,
            constraints: {
              min: constraints.minBudgetTokens,
              max: constraints.maxBudgetTokens,
            },
          });
        }
      }

      // Validate thinking level (Gemini)
      if (
        config.thinkingConfig.thinkingLevel &&
        constraints?.validThinkingLevels
      ) {
        const level = config.thinkingConfig.thinkingLevel as ThinkingLevel;
        if (!constraints.validThinkingLevels.includes(level)) {
          errors.push({
            code: 'INVALID_THINKING_LEVEL',
            field: 'thinkingConfig.thinkingLevel',
            message: `${modelInfo.name} does not support thinking level "${level}"`,
            suggestion: `Use one of: ${constraints.validThinkingLevels.join(', ')}`,
            constraints: {
              allowed: constraints.validThinkingLevels,
            },
          });
        }
      }
    }
  }

  // 5. Validate max output tokens
  if (config.maxOutputTokens && modelInfo) {
    if (config.maxOutputTokens > modelInfo.maxOutputTokens) {
      errors.push({
        code: 'MAX_OUTPUT_TOKENS_EXCEEDED',
        field: 'maxOutputTokens',
        message: `Requested ${config.maxOutputTokens.toLocaleString()} tokens exceeds model max of ${modelInfo.maxOutputTokens.toLocaleString()}`,
        suggestion: `Set max output tokens to ${modelInfo.maxOutputTokens.toLocaleString()} or less`,
        constraints: {
          max: modelInfo.maxOutputTokens,
        },
      });
    }
  }

  // 6. Validate max context tokens
  if (config.maxContextTokens && modelInfo) {
    if (config.maxContextTokens > modelInfo.contextWindow) {
      errors.push({
        code: 'MAX_CONTEXT_TOKENS_EXCEEDED',
        field: 'maxContextTokens',
        message: `Requested ${config.maxContextTokens.toLocaleString()} tokens exceeds model's context window of ${modelInfo.contextWindow.toLocaleString()}`,
        suggestion: `Set max context tokens to ${modelInfo.contextWindow.toLocaleString()} or less`,
        constraints: {
          max: modelInfo.contextWindow,
        },
      });
    }
    if (config.maxContextTokens < 1000) {
      errors.push({
        code: 'MAX_CONTEXT_TOKENS_TOO_LOW',
        field: 'maxContextTokens',
        message: `Max context tokens ${config.maxContextTokens.toLocaleString()} is too low`,
        suggestion: 'Set max context tokens to at least 1,000',
        constraints: {
          min: 1000,
        },
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Custom error class for agent validation failures.
 * Contains field-level errors for frontend display.
 */
export class AgentValidationError extends Error {
  public readonly fieldErrors: ValidationFieldError[];

  constructor(result: ValidationResult) {
    const messages = result.errors.map((e) => e.message).join('; ');
    super(`Agent validation failed: ${messages}`);
    this.name = 'AgentValidationError';
    this.fieldErrors = result.errors;
  }

  /**
   * Get errors grouped by field for frontend display
   */
  getFieldErrorMap(): Record<string, ValidationFieldError[]> {
    const map: Record<string, ValidationFieldError[]> = {};
    for (const error of this.fieldErrors) {
      const existing = map[error.field];
      if (!existing) {
        map[error.field] = [];
      }
      map[error.field]!.push(error);
    }
    return map;
  }
}
