import type { ThinkingConfigProvider } from '../registry';
import type { OpenAIThinkingConfig as OpenAIThinkingConfigType } from '../thinking-config-types';
import {
  OpenAIThinkingConfig,
  validateOpenAIConfig,
  OPENAI_CONSTANTS,
} from './OpenAIThinkingConfig';

// Re-export for backwards compatibility
export { OpenAIThinkingConfig, validateOpenAIConfig, OPENAI_CONSTANTS };

/**
 * OpenAI provider implementation.
 * Encapsulates all OpenAI-specific thinking config logic.
 */
export const openaiProvider: ThinkingConfigProvider<OpenAIThinkingConfigType> = {
  id: 'openai',

  constants: {
    effortOptions: OPENAI_CONSTANTS.effortOptions,
    effortDefault: OPENAI_CONSTANTS.effortDefault,
  },

  createDefaultConfig(): OpenAIThinkingConfigType {
    return {
      provider: 'openai',
      enabled: true,
      reasoningEffort: OPENAI_CONSTANTS.effortDefault,
    };
  },

  validate(config: OpenAIThinkingConfigType) {
    return validateOpenAIConfig(config);
  },

  Component: OpenAIThinkingConfig,
};
