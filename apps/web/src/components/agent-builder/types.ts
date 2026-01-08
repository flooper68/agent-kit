// Types for the Agent Builder

export interface ThinkingConfig {
  enabled: boolean;
  budgetTokens?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
  thinkingLevel?: 'minimal' | 'low' | 'medium' | 'high';
  thinkingBudget?: number;
}

export interface AgentFormData {
  // Identity
  key: string;
  name: string;
  description: string;
  // Agent configuration
  provider: 'anthropic' | 'openai' | 'gemini';
  model: string;
  systemPrompt: string;
  tools: string[];
  // Model settings
  temperature: number | null;
  maxOutputTokens: number | null;
  maxContextTokens: number | null; // null = use model's default contextWindow
  thinkingConfig: ThinkingConfig | null;
  // User preferences
  isFavorite: boolean;
}

export const DEFAULT_AGENT_FORM_DATA: AgentFormData = {
  key: '',
  name: '',
  description: '',
  provider: 'anthropic',
  model: 'claude-sonnet-4-5-20250929',
  systemPrompt: 'You are a helpful AI assistant.',
  tools: [],
  temperature: null,
  maxOutputTokens: null,
  maxContextTokens: null,
  thinkingConfig: null,
  isFavorite: false,
};

export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface ThinkingConstraints {
  minBudgetTokens?: number;
  maxBudgetTokens?: number;
  validThinkingLevels?: string[];
}

export interface ModelPricing {
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  cacheReadPricePerMillion?: number;
  cacheWritePricePerMillion?: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  supportsThinking: boolean;
  thinkingType?: string;
  thinkingConstraints?: ThinkingConstraints;
  contextWindow: number;
  maxOutputTokens: number;
  costTier: number;
  pricing?: ModelPricing;
}

export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
}
