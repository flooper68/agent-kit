import type { ThinkingConfigProvider } from '../registry';
import type { AnthropicThinkingConfig as AnthropicThinkingConfigType } from '../thinking-config-types';
import {
  AnthropicThinkingConfig,
  validateAnthropicConfig,
  ANTHROPIC_CONSTANTS,
} from './AnthropicThinkingConfig';

// Re-export for backwards compatibility
export { AnthropicThinkingConfig, validateAnthropicConfig, ANTHROPIC_CONSTANTS };

/**
 * Anthropic provider implementation.
 * Encapsulates all Anthropic-specific thinking config logic.
 */
export const anthropicProvider: ThinkingConfigProvider<AnthropicThinkingConfigType> =
  {
    id: 'anthropic',

    constants: {
      budgetMin: ANTHROPIC_CONSTANTS.budgetMin,
      budgetMax: ANTHROPIC_CONSTANTS.budgetMax,
      budgetDefault: ANTHROPIC_CONSTANTS.budgetDefault,
    },

    createDefaultConfig(): AnthropicThinkingConfigType {
      return {
        provider: 'anthropic',
        enabled: true,
        budgetTokens: ANTHROPIC_CONSTANTS.budgetDefault,
      };
    },

    validate(config: AnthropicThinkingConfigType) {
      return validateAnthropicConfig(config);
    },

    Component: AnthropicThinkingConfig,
  };
