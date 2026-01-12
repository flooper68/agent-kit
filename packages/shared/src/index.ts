// Server tool definitions - single source of truth for all tool metadata
export {
  // Tool definitions and metadata
  SERVER_TOOL_DEFINITIONS,
  ALL_TOOL_NAMES,
  SERVER_TOOL_NAMES,
  getToolDefinition,
  getToolsByCategory,
  // Schemas
  ServerToolNameSchema,
  ServerToolRequestSchema,
  ServerToolResponseSchema,
  TaskStatusSchema,
  TaskPrioritySchema,
  WebSearchTopicSchema,
  // Individual tool schemas
  getTimeSchema,
  webSearchSchema,
  extractContentSchema,
  fetchSchema,
  writeArtifactSchema,
  searchArtifactsSchema,
  getArtifactSchema,
  updateArtifactSchema,
  listProjectsSchema,
  searchProjectsSchema,
  getProjectSchema,
  createProjectSchema,
  updateProjectSchema,
  deleteProjectSchema,
  listTasksSchema,
  searchTasksSchema,
  getTaskSchema,
  createTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
  moveTaskSchema,
  reorderTaskSchema,
  attachArtifactToTaskSchema,
  detachArtifactFromTaskSchema,
  navigateToSchema,
  getCurrentUIStateSchema,
  spawnAgentSchema,
  listAgentsSchema,
  getAgentSchema,
  updateAgentSchema,
  setAgentEnabledSchema,
  toggleAgentFavoriteSchema,
  listSkillsSchema,
  getSkillSchema,
  listSkillFilesSchema,
  readSkillFileSchema,
  executeCommandSchema,
  createSkillSchema,
  updateSkillSchema,
  deleteSkillSchema,
} from './server-tools';

export type {
  ServerToolName,
  ServerToolRequest,
  ServerToolResponse,
  ServerToolDefinition,
  ToolName,
  ToolCategory,
  TaskStatus,
  TaskPriority,
} from './server-tools';

// Spawn configuration constants
export { SPAWN_DEFAULTS } from './spawn-config';

// Agent permission scopes
export { AgentScope, ALL_SCOPES, DEFAULT_AGENT_SCOPES } from './scopes';
