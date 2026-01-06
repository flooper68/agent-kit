/**
 * Model pricing configuration per million tokens (input/output).
 * Prices as of January 2026.
 */

export interface ModelPricing {
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  // Cache pricing (optional - if not specified, uses inputPricePerMillion)
  cacheReadPricePerMillion?: number; // ~10% of input for Anthropic
  cacheWritePricePerMillion?: number; // ~125% of input for Anthropic
}

/**
 * Usage object for cost calculation
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
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

  // Anthropic (cache read: 10% of input, cache write: 125% of input)
  'claude-opus-4-5-20251101': {
    inputPricePerMillion: 5.0,
    outputPricePerMillion: 25.0,
    cacheReadPricePerMillion: 0.5,
    cacheWritePricePerMillion: 6.25,
  },
  'claude-sonnet-4-5-20250929': {
    inputPricePerMillion: 3.0,
    outputPricePerMillion: 15.0,
    cacheReadPricePerMillion: 0.3,
    cacheWritePricePerMillion: 3.75,
  },
  'claude-haiku-4-5-20251001': {
    inputPricePerMillion: 1.0,
    outputPricePerMillion: 5.0,
    cacheReadPricePerMillion: 0.1,
    cacheWritePricePerMillion: 1.25,
  },
  'claude-opus-4-1-20250805': {
    inputPricePerMillion: 15.0,
    outputPricePerMillion: 75.0,
    cacheReadPricePerMillion: 1.5,
    cacheWritePricePerMillion: 18.75,
  },
  'claude-sonnet-4-20250514': {
    inputPricePerMillion: 3.0,
    outputPricePerMillion: 15.0,
    cacheReadPricePerMillion: 0.3,
    cacheWritePricePerMillion: 3.75,
  },
  'claude-3-5-haiku-20241022': {
    inputPricePerMillion: 0.8,
    outputPricePerMillion: 4.0,
    cacheReadPricePerMillion: 0.08,
    cacheWritePricePerMillion: 1.0,
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
 * Accounts for cache pricing when available.
 *
 * @param model - The model identifier
 * @param usage - Token usage object with prompt, completion, and optional cache tokens
 * @returns The estimated cost in USD
 */
export function calculateCost(model: string, usage: TokenUsage): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;

  const { promptTokens, completionTokens, cacheReadTokens, cacheWriteTokens } =
    usage;

  // Calculate regular input tokens (excluding cache read tokens if present)
  // Note: promptTokens from the API already includes cache reads, so we subtract them
  const regularInputTokens = promptTokens - (cacheReadTokens ?? 0);

  // Cache read price defaults to input price if not specified
  const cacheReadPrice =
    pricing.cacheReadPricePerMillion ?? pricing.inputPricePerMillion;

  // Cache write price defaults to input price if not specified
  const cacheWritePrice =
    pricing.cacheWritePricePerMillion ?? pricing.inputPricePerMillion;

  return (
    (regularInputTokens * pricing.inputPricePerMillion +
      (cacheReadTokens ?? 0) * cacheReadPrice +
      (cacheWriteTokens ?? 0) * cacheWritePrice +
      completionTokens * pricing.outputPricePerMillion) /
    1_000_000
  );
}
