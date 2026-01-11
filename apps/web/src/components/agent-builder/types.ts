// Types for the Agent Builder

export interface ThinkingConfig {
  enabled: boolean;
  budgetTokens?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
  thinkingLevel?: 'minimal' | 'low' | 'medium' | 'high';
  thinkingBudget?: number;
}

/**
 * Allowed subagents - IDs of agents this agent can spawn
 * Uses separate arrays for proper foreign key relationships
 */
export interface AllowedSubagents {
  serverAgentIds?: string[];
  externalAgentIds?: string[];
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
  // Sub-agent permissions
  allowedSubagents: AllowedSubagents;
  // Skill permissions
  allowedSkillIds: string[];
  // Agent scopes (permissions for actions)
  scopes: string[];
}

export const DEFAULT_AGENT_FORM_DATA: AgentFormData = {
  key: '',
  name: '',
  description: '',
  provider: 'anthropic',
  model: 'claude-sonnet-4-5-20250929',
  systemPrompt: 'You are a helpful AI assistant.',
  tools: [
    // Core tools
    'spawnAgent',
    'listSkillFiles',
    'readSkillFile',
    'executeCommand',
    // Utility tools
    'getTime',
    'webSearch',
    'extractContent',
    'fetch',
    // Artifact tools
    'writeArtifact',
    'readArtifact',
    'searchArtifacts',
    'updateArtifact',
    // Project tools
    'listProjects',
    'searchProjects',
    'getProject',
    'createProject',
    'updateProject',
    'deleteProject',
    // Task tools
    'listTasks',
    'searchTasks',
    'getTask',
    'createTask',
    'updateTask',
    'deleteTask',
    'moveTask',
    'reorderTask',
    'attachArtifactToTask',
    'detachArtifactFromTask',
    // Navigation tools
    'navigateTo',
    'getCurrentUIState',
    // Agent tools
    'listAgents',
    'getAgent',
    'updateAgent',
    'setAgentEnabled',
    'toggleAgentFavorite',
    // Skill management tools
    'listSkills',
    'getSkill',
    'createSkill',
    'updateSkill',
    'deleteSkill',
  ],
  temperature: null,
  maxOutputTokens: null,
  maxContextTokens: null,
  thinkingConfig: null,
  isFavorite: false,
  allowedSubagents: {},
  allowedSkillIds: [],
  scopes: [
    // Utilities - basic functions
    'utilities:time',
    'utilities:webSearch',
    'utilities:fetch',
    'utilities:extract',
    // Artifacts - document access
    'artifacts:read',
    'artifacts:write',
    // Tasks - task management
    'tasks:read',
    'tasks:write',
    // Projects - read-only
    'projects:read',
    // UI - interaction
    'ui:navigate',
    'ui:state',
  ],
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
