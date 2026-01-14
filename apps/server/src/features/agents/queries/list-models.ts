import {
  MODELS,
  getModelsForProviderWithPricing,
  type ModelInfoWithPricing,
  type Provider,
} from '../../../agent/providers/model-config';
import { MODEL_PRICING } from '../pricing';

export interface ListModelsInput {
  provider?: Provider;
}

export type ListModelsResult = ModelInfoWithPricing[];

/**
 * Query to list available models, optionally filtered by provider.
 * Excludes deprecated models from results.
 * Includes pricing information for each model.
 */
export class ListModelsQuery {
  execute(input: ListModelsInput): ListModelsResult {
    if (input.provider) {
      return getModelsForProviderWithPricing(input.provider);
    }
    return Object.values(MODELS)
      .filter((m) => !m.deprecated)
      .map((m) => ({
        ...m,
        pricing: MODEL_PRICING[m.id],
      }));
  }
}
