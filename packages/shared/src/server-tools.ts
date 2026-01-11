import { z } from 'zod';

// =============================================================================
// Tool Category (basic only for tools)
// =============================================================================

export type ToolCategory = 'basic';

// =============================================================================
// Tool Definition Type
// =============================================================================

export interface ToolDefinition<T extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  schema: T;
  category: ToolCategory;
}

// =============================================================================
// Tool Schemas (Basic Tools Only)
// =============================================================================

export const spawnAgentSchema = z.object({
  agentId: z
    .string()
    .min(1, 'Agent ID is required')
    .max(64, 'Agent ID must be 64 characters or less')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Agent ID can only contain letters, numbers, underscores, and hyphens'
    )
    .describe('ID of the agent to spawn'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(50000, 'Message must be 50,000 characters or less')
    .describe('The task/message to send to the spawned agent'),
});

export const listSkillFilesSchema = z.object({
  skillKey: z
    .string()
    .min(1)
    .describe('The skill key to list files for (e.g., "web-research")'),
});

export const readSkillFileSchema = z.object({
  path: z.string().min(1).describe('File path in format "skillKey/filePath"'),
  lines: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Number of lines to read (default: all)'),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Starting line number, 0-indexed (default: 0)'),
});

export const executeCommandSchema = z.object({
  command: z
    .string()
    .min(1)
    .describe(
      'CLI-style command: toolName --arg1 value1 --arg2 "value with spaces"'
    ),
});

// =============================================================================
// Tool Definitions (Basic Tools Only)
// =============================================================================

export const TOOL_DEFINITIONS = {
  spawnAgent: {
    name: 'spawnAgent',
    description: `Spawn another agent to handle a specific task. The spawned agent runs in its own fresh session with only the message you provide - it does not have access to your conversation history.

Use this tool to:
- Delegate specialized tasks to other agents
- Get a second opinion or alternative approach
- Run subtasks that benefit from a clean context

The tool will wait for the spawned agent to complete and return its full response.`,
    schema: spawnAgentSchema,
    category: 'basic' as const,
  },
  listSkillFiles: {
    name: 'listSkillFiles',
    description: `List all files in a skill.

Use this after reading a skill's SKILL.md to discover available reference files.
Returns file paths with line counts to help you decide what to read.

Path format for readSkillFile: "skillKey/filePath" (e.g., "web-research/references/tips.md")`,
    schema: listSkillFilesSchema,
    category: 'basic' as const,
  },
  readSkillFile: {
    name: 'readSkillFile',
    description: `Read a skill file by path. Skills are documentation bundles that teach how to use tools.

Path format: "skillKey/filePath" (e.g., "web-research/SKILL.md")

Use listSkillFiles first to discover available files in a skill.`,
    schema: readSkillFileSchema,
    category: 'basic' as const,
  },
  executeCommand: {
    name: 'executeCommand',
    description: `Execute an action using CLI-style syntax.

Command format:
  actionName --arg1 value1 --arg2 "value with spaces"

Examples:
  webSearch --query "typescript best practices"
  createTask --projectId abc123 --title "Implement feature" --priority high
  readArtifact --artifactId def456
  getTime --timezone "America/New_York"

Notes:
- Use quotes for values with spaces
- Boolean flags: --verbose (sets to true)
- Numbers are parsed automatically
- JSON objects/arrays supported in quotes`,
    schema: executeCommandSchema,
    category: 'basic' as const,
  },
} as const;

// =============================================================================
// Derived Types and Exports
// =============================================================================

/**
 * All tool names derived from definitions (single source of truth)
 */
export const ALL_TOOL_NAMES = Object.keys(
  TOOL_DEFINITIONS
) as (keyof typeof TOOL_DEFINITIONS)[];

/**
 * Type representing any valid tool name
 */
export type ToolName = keyof typeof TOOL_DEFINITIONS;

/**
 * Get a tool definition by name
 */
export function getToolDefinition<T extends ToolName>(
  name: T
): (typeof TOOL_DEFINITIONS)[T] {
  return TOOL_DEFINITIONS[name];
}

/**
 * List all tool names
 */
export function listToolNames(): ToolName[] {
  return ALL_TOOL_NAMES;
}

// =============================================================================
// Legacy Exports (for backward compatibility during migration)
// Re-export from server-actions for code that still imports from here
// =============================================================================

// Re-export common types from actions
export {
  TaskStatusSchema,
  TaskPrioritySchema,
  WebSearchTopicSchema,
  type TaskStatus,
  type TaskPriority,
  type ActionCategory,
  type ActionDefinition,
  ACTION_DEFINITIONS,
  ALL_ACTION_NAMES,
  type ActionName,
  getActionDefinition,
  getActionsByCategory,
  listActionNames,
  // Re-export all action schemas for backward compatibility
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
// Backward Compatibility: SERVER_TOOL_DEFINITIONS
// Combined object of tools + actions for legacy code
// =============================================================================

import {
  ACTION_DEFINITIONS as _ACTION_DEFINITIONS,
  type ActionCategory as _ActionCategory,
} from './server-actions';

/**
 * @deprecated Use TOOL_DEFINITIONS for tools and ACTION_DEFINITIONS for actions
 * Combined definitions for backward compatibility
 */
export const SERVER_TOOL_DEFINITIONS = {
  ...TOOL_DEFINITIONS,
  ..._ACTION_DEFINITIONS,
} as const;

/**
 * @deprecated Use ToolName or ActionName instead
 */
export type ServerToolName = keyof typeof SERVER_TOOL_DEFINITIONS;

/**
 * @deprecated Use getToolDefinition or getActionDefinition instead
 */
export function getToolsByCategory(category: ToolCategory | _ActionCategory) {
  if (category === 'basic') {
    return Object.values(TOOL_DEFINITIONS);
  }
  return Object.values(_ACTION_DEFINITIONS).filter(
    (def) => def.category === category
  );
}

// Legacy type for ServerToolDefinition
export type ServerToolDefinition<T extends z.ZodType = z.ZodType> =
  | ToolDefinition<T>
  | import('./server-actions').ActionDefinition<T>;

// Legacy SERVER_TOOL_NAMES - tools accessible to remote agents
export const SERVER_TOOL_NAMES = [
  'spawnAgent',
  'listSkillFiles',
  'readSkillFile',
  'executeCommand',
] as const;

export const ServerToolNameSchema = z.enum(SERVER_TOOL_NAMES);

/**
 * Schema for server tool request messages
 */
export const ServerToolRequestSchema = z.object({
  type: z.literal('server_tool_request'),
  requestId: z.string().uuid(),
  sessionId: z.string().uuid(),
  tool: ServerToolNameSchema,
  params: z.record(z.string(), z.unknown()),
  timestamp: z.string(),
});

export type ServerToolRequest = z.infer<typeof ServerToolRequestSchema>;

/**
 * Schema for server tool response messages
 */
export const ServerToolResponseSchema = z.object({
  type: z.literal('server_tool_response'),
  requestId: z.string().uuid(),
  sessionId: z.string().uuid(),
  result: z.unknown(),
  isError: z.boolean().optional(),
  timestamp: z.string(),
});

export type ServerToolResponse = z.infer<typeof ServerToolResponseSchema>;
