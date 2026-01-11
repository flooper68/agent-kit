// =============================================================================
// Server Actions - executable via executeCommand
// =============================================================================

export {
  // Action definitions and metadata
  ACTION_DEFINITIONS,
  ALL_ACTION_NAMES,
  getActionDefinition,
  getActionsByCategory,
  listActionNames,
  // Types
  type ActionCategory,
  type ActionDefinition,
  type ActionName,
  // Common schemas
  TaskStatusSchema,
  TaskPrioritySchema,
  WebSearchTopicSchema,
  TavilyExtractFormatSchema,
  SkillFilePathSchema,
  SkillFileSchema,
  type TaskStatus,
  type TaskPriority,
  // Action schemas
  getTimeSchema,
  webSearchSchema,
  extractContentSchema,
  fetchSchema,
  writeArtifactSchema,
  searchArtifactsSchema,
  readArtifactSchema,
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
  listAgentsSchema,
  getAgentSchema,
  updateAgentSchema,
  setAgentEnabledSchema,
  toggleAgentFavoriteSchema,
  listSkillsSchema,
  getSkillSchema,
  createSkillSchema,
  updateSkillSchema,
  deleteSkillSchema,
} from './server-actions';

// =============================================================================
// Server Tools - directly exposed to agents as MCP tools
// =============================================================================

export {
  // Tool definitions and metadata
  TOOL_DEFINITIONS,
  ALL_TOOL_NAMES,
  getToolDefinition,
  listToolNames,
  // Types
  type ToolCategory,
  type ToolDefinition,
  type ToolName,
  // Tool schemas
  spawnAgentSchema,
  listSkillFilesSchema,
  readSkillFileSchema,
  executeCommandSchema,
  // Request/Response schemas
  ServerToolNameSchema,
  ServerToolRequestSchema,
  ServerToolResponseSchema,
  type ServerToolRequest,
  type ServerToolResponse,
} from './server-tools';

// =============================================================================
// Legacy/Backward Compatibility Exports
// =============================================================================

export {
  // @deprecated - Use TOOL_DEFINITIONS + ACTION_DEFINITIONS
  SERVER_TOOL_DEFINITIONS,
  SERVER_TOOL_NAMES,
  // @deprecated - Use getToolDefinition or getActionDefinition
  getToolsByCategory,
  // @deprecated types
  type ServerToolDefinition,
  type ServerToolName,
} from './server-tools';
