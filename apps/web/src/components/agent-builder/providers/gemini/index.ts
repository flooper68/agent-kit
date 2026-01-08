import type { ThinkingConfigProvider } from '../registry';
import type {
  GeminiThinkingConfig as GeminiThinkingConfigType,
  GeminiLevelThinkingConfig,
  GeminiBudgetThinkingConfig,
} from '../thinking-config-types';
import type { ModelInfo } from '../../types';
import {
  GeminiThinkingConfig,
  validateGeminiConfig,
  GEMINI_CONSTANTS,
} from './GeminiThinkingConfig';

// Re-export for backwards compatibility
export { GeminiThinkingConfig, validateGeminiConfig, GEMINI_CONSTANTS };

/**
 * Gemini provider implementation.
 * Encapsulates all Gemini-specific thinking config logic.
 * Handles both level-based (Gemini 3) and budget-based (Gemini 2.5) modes.
 */
export const geminiProvider: ThinkingConfigProvider<GeminiThinkingConfigType> = {
  id: 'gemini',

  constants: {
    levelOptions: GEMINI_CONSTANTS.levelOptions,
    levelDefault: GEMINI_CONSTANTS.levelDefault,
    thinkingBudgetMin: GEMINI_CONSTANTS.thinkingBudgetMin,
    thinkingBudgetMax: GEMINI_CONSTANTS.thinkingBudgetMax,
    thinkingBudgetDefault: GEMINI_CONSTANTS.thinkingBudgetDefault,
  },

  createDefaultConfig(modelInfo?: ModelInfo): GeminiThinkingConfigType {
    // Determine mode from model info
    if (modelInfo?.thinkingType === 'level') {
      const validLevels = modelInfo.thinkingConstraints?.validThinkingLevels;
      const defaultLevel =
        (validLevels?.[0] as 'minimal' | 'low' | 'medium' | 'high') ??
        GEMINI_CONSTANTS.levelDefault;

      return {
        provider: 'gemini',
        thinkingType: 'level',
        enabled: true,
        thinkingLevel: defaultLevel,
      } satisfies GeminiLevelThinkingConfig;
    }

    // Default to budget-legacy mode
    return {
      provider: 'gemini',
      thinkingType: 'budget-legacy',
      enabled: true,
      thinkingBudget: GEMINI_CONSTANTS.thinkingBudgetDefault,
    } satisfies GeminiBudgetThinkingConfig;
  },

  validate(config: GeminiThinkingConfigType, modelInfo?: ModelInfo) {
    const validLevels = modelInfo?.thinkingConstraints?.validThinkingLevels;
    return validateGeminiConfig(config, validLevels);
  },

  Component: GeminiThinkingConfig,
};
