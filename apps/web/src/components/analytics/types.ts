export interface ProviderDistributionItem {
  provider: string;
  sessions: number;
  tokens: number;
  promptTokens: number;
  completionTokens: number;
  cost: number;
}
