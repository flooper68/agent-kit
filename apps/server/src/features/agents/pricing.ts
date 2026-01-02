/**
 * Model pricing configuration per million tokens (input/output).
 * Prices as of January 2026.
 */

export interface ModelPricing {
  inputPricePerMillion: number;
  outputPricePerMillion: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-5.2': { inputPricePerMillion: 1.75, outputPricePerMillion: 14.0 },
  'gpt-5.2-codex': { inputPricePerMillion: 1.75, outputPricePerMillion: 14.0 },
  'gpt-5': { inputPricePerMillion: 1.25, outputPricePerMillion: 10.0 },
  'gpt-5-mini': { inputPricePerMillion: 0.25, outputPricePerMillion: 2.0 },
  'gpt-5-nano': { inputPricePerMillion: 0.05, outputPricePerMillion: 0.4 },
  o3: { inputPricePerMillion: 2.0, outputPricePerMillion: 8.0 },
  'o4-mini': { inputPricePerMillion: 1.1, outputPricePerMillion: 4.4 },
  'gpt-4o': { inputPricePerMillion: 2.5, outputPricePerMillion: 10.0 },
  'gpt-4o-mini': { inputPricePerMillion: 0.15, outputPricePerMillion: 0.6 },

  // Anthropic
  'claude-opus-4-5-20251101': {
    inputPricePerMillion: 5.0,
    outputPricePerMillion: 25.0,
  },
  'claude-sonnet-4-5-20250929': {
    inputPricePerMillion: 3.0,
    outputPricePerMillion: 15.0,
  },
  'claude-haiku-4-5-20251001': {
    inputPricePerMillion: 1.0,
    outputPricePerMillion: 5.0,
  },
  'claude-opus-4-1-20250805': {
    inputPricePerMillion: 15.0,
    outputPricePerMillion: 75.0,
  },
  'claude-sonnet-4-20250514': {
    inputPricePerMillion: 3.0,
    outputPricePerMillion: 15.0,
  },
  'claude-3-5-haiku-20241022': {
    inputPricePerMillion: 0.8,
    outputPricePerMillion: 4.0,
  },

  // Google Gemini
  'gemini-3-pro-preview': {
    inputPricePerMillion: 2.0,
    outputPricePerMillion: 12.0,
  },
  'gemini-3-flash-preview': {
    inputPricePerMillion: 0.5,
    outputPricePerMillion: 3.0,
  },
  'gemini-2.5-pro': { inputPricePerMillion: 1.25, outputPricePerMillion: 10.0 },
  'gemini-2.5-flash': {
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.6,
  },
  'gemini-2.5-flash-lite': {
    inputPricePerMillion: 0.1,
    outputPricePerMillion: 0.4,
  },
  'gemini-2.0-flash': { inputPricePerMillion: 0.1, outputPricePerMillion: 0.4 },
};

/**
 * Calculate the cost for a given model and token usage.
 * @param model - The model identifier
 * @param promptTokens - Number of input/prompt tokens
 * @param completionTokens - Number of output/completion tokens
 * @returns The estimated cost in USD
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  return (
    (promptTokens * pricing.inputPricePerMillion +
      completionTokens * pricing.outputPricePerMillion) /
    1_000_000
  );
}
