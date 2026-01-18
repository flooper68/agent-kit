import { z } from 'zod';

// =============================================================================
// Common Schemas
// =============================================================================

export const TaskStatusSchema = z.enum([
  'backlog',
  'todo',
  'in_progress',
  'review',
  'done',
]);

export const TaskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

// Web search topic schema (matches Tavily API)
export const WebSearchTopicSchema = z.enum(['general', 'news']);

// =============================================================================
// Tool Categories
// =============================================================================

export type ToolCategory =
  | 'basic'
  | 'utility'
  | 'artifact'
  | 'project'
  | 'task'
  | 'navigation'
  | 'agent'
  | 'skillManagement'
  | 'slashCommand';

// =============================================================================
// Tool Definition Type
// =============================================================================

export interface ServerToolDefinition<T extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  schema: T;
  category: ToolCategory;
}

// =============================================================================
// Individual Tool Schemas
// =============================================================================

// --- Utility Tools ---
export const getTimeSchema = z.object({
  timezone: z
    .string()
    .optional()
    .describe('IANA timezone (e.g., "America/New_York", "Europe/London")'),
});

export const webSearchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query cannot be empty')
    .max(500, 'Search query is too long')
    .describe('The search query'),
  maxResults: z
    .number()
    .min(1)
    .max(10)
    .default(5)
    .describe('Maximum number of results to return'),
  topic: WebSearchTopicSchema.optional().describe(
    'Topic category to focus the search'
  ),
});

export const extractContentSchema = z.object({
  url: z.string().url().describe('The URL to extract content from'),
});

export const fetchSchema = z.object({
  url: z.string().url().describe('The URL to fetch'),
  method: z
    .enum(['GET', 'POST', 'PUT', 'DELETE'])
    .default('GET')
    .describe('HTTP method'),
  headers: z.record(z.string()).optional().describe('HTTP headers to include'),
  body: z.string().optional().describe('Request body (for POST/PUT)'),
});

// --- Artifact Tools ---
export const writeArtifactSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less')
    .refine((val) => val.trim().length > 0, 'Title cannot be only whitespace')
    .describe('The title of the document'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(1_000_000, 'Content must be 1MB or less')
    .describe('The markdown content of the document (max 1MB)'),
  summary: z
    .string()
    .max(500, 'Summary must be 500 characters or less')
    .optional()
    .describe(
      'A brief 1-2 sentence summary of the content for search purposes'
    ),
});

export const searchArtifactsSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(500, 'Search query is too long')
    .refine(
      (val) => val === '*' || val.trim().length > 0,
      'Search query cannot be only whitespace'
    )
    .describe(
      'Search query to find artifacts by title or content. Use "*" to list all documents.'
    ),
  limit: z
    .number()
    .int('Limit must be an integer')
    .min(1)
    .max(50)
    .default(10)
    .describe('Maximum number of results to return'),
});

export const getArtifactSchema = z.object({
  artifactId: z.string().uuid().describe('The artifact ID to read'),
  startLine: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe(
      'Line number to start reading from (1-indexed). Omit to start from beginning.'
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(10000)
    .optional()
    .describe(
      'Maximum number of lines to return (max 10000). Omit to return all content.'
    ),
});

export const updateArtifactSchema = z.object({
  artifactId: z.string().uuid().describe('The artifact ID to update'),
  title: z
    .string()
    .min(1)
    .max(255)
    .optional()
    .describe('New title for the document'),
  content: z
    .string()
    .min(1)
    .max(1_000_000)
    .optional()
    .describe('New content for the document'),
  summary: z
    .string()
    .max(500)
    .optional()
    .describe('New summary for the document'),
});

export const patchArtifactSchema = z.object({
  artifactId: z.string().uuid().describe('The artifact ID to patch'),
  startLine: z
    .number()
    .int()
    .min(1)
    .describe('The starting line number (1-indexed, inclusive)'),
  endLine: z
    .number()
    .int()
    .min(0)
    .describe(
      'The ending line number (1-indexed, inclusive). Set to startLine - 1 to insert without replacing.'
    ),
  newContent: z
    .string()
    .max(1_000_000)
    .describe(
      'The content to replace the specified line range with. Empty string deletes the lines.'
    ),
});

// --- Project Tools ---
export const listProjectsSchema = z.object({
  limit: z
    .number()
    .min(1)
    .max(50)
    .default(20)
    .describe('Maximum number of projects to return'),
});

export const searchProjectsSchema = z.object({
  query: z
    .string()
    .min(1)
    .max(500)
    .describe('Search query to find projects by title or summary'),
  limit: z
    .number()
    .min(1)
    .max(50)
    .default(10)
    .describe('Maximum number of results to return'),
});

export const getProjectSchema = z.object({
  projectId: z.string().uuid().describe('The project ID to retrieve'),
});

export const createProjectSchema = z.object({
  title: z.string().min(1).max(255).describe('The project title'),
  summary: z.string().max(1000).optional().describe('Project summary'),
});

export const updateProjectSchema = z.object({
  projectId: z.string().uuid().describe('The project ID to update'),
  title: z.string().min(1).max(255).optional().describe('New project title'),
  summary: z.string().max(1000).optional().describe('New project summary'),
});

export const deleteProjectSchema = z.object({
  projectId: z.string().uuid().describe('The project ID to delete'),
});

// --- Task Tools ---
export const listTasksSchema = z.object({
  projectId: z.string().uuid().describe('The project ID to list tasks from'),
  status: TaskStatusSchema.optional().describe('Filter by task status'),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(50)
    .describe('Maximum number of tasks to return'),
});

export const searchTasksSchema = z.object({
  query: z.string().min(1).max(500).describe('Search query for tasks'),
  projectId: z.string().uuid().optional().describe('Filter by project'),
  status: TaskStatusSchema.optional().describe('Filter by status'),
  limit: z.number().min(1).max(50).default(10).describe('Maximum results'),
});

export const getTaskSchema = z.object({
  taskId: z.string().uuid().describe('The task ID to retrieve'),
});

export const createTaskSchema = z.object({
  projectId: z.string().uuid().describe('The project ID to create the task in'),
  title: z.string().min(1).max(255).describe('The task title'),
  description: z
    .string()
    .max(5000)
    .optional()
    .describe('Detailed task description'),
  priority: TaskPrioritySchema.default('medium').describe(
    'Task priority: low, medium, high, or urgent'
  ),
  status: TaskStatusSchema.default('todo').describe(
    'Task status: backlog, todo, in_progress, review, or done'
  ),
});

export const updateTaskSchema = z.object({
  taskId: z.string().uuid().describe('The task ID to update'),
  title: z.string().min(1).max(255).optional().describe('New task title'),
  description: z.string().max(5000).optional().describe('New description'),
  priority: TaskPrioritySchema.optional().describe('New priority'),
  status: TaskStatusSchema.optional().describe('New status'),
});

export const deleteTaskSchema = z.object({
  taskId: z.string().uuid().describe('The task ID to delete'),
});

export const moveTaskSchema = z.object({
  taskId: z.string().uuid().describe('The task ID to move'),
  status: TaskStatusSchema.describe('The new status/column'),
});

export const reorderTaskSchema = z.object({
  taskId: z.string().uuid().describe('The task ID to reorder'),
  position: z
    .number()
    .int()
    .min(0)
    .describe('New position index in the column'),
});

export const attachArtifactToTaskSchema = z.object({
  taskId: z.string().uuid().describe('The task ID'),
  artifactId: z.string().uuid().describe('The artifact ID to attach'),
});

export const detachArtifactFromTaskSchema = z.object({
  taskId: z.string().uuid().describe('The task ID'),
  artifactId: z.string().uuid().describe('The artifact ID to detach'),
});

// --- Navigation Tools ---
export const navigateToSchema = z.object({
  path: z.string().min(1).describe('The path to navigate to'),
});

export const getCurrentUIStateSchema = z.object({});

// --- Agent Tools ---
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

export const listAgentsSchema = z.object({
  includeDisabled: z
    .boolean()
    .default(false)
    .describe('Include disabled agents in the list'),
});

export const getAgentSchema = z.object({
  agentKey: z.string().min(1).describe('The agent key to retrieve'),
  agentType: z.enum(['external', 'server']).describe('Type of agent'),
});

export const updateAgentSchema = z.object({
  agentKey: z.string().min(1).describe('The agent key to update'),
  agentType: z.enum(['external', 'server']).describe('Type of agent'),
  name: z.string().min(1).max(255).optional().describe('New agent name'),
  description: z.string().max(2000).optional().describe('New description'),
});

export const setAgentEnabledSchema = z.object({
  agentKey: z.string().min(1).describe('The agent key'),
  agentType: z.enum(['external', 'server']).describe('Type of agent'),
  enabled: z.boolean().describe('Whether to enable or disable the agent'),
});

export const toggleAgentFavoriteSchema = z.object({
  agentKey: z.string().min(1).describe('The agent key'),
  agentType: z.enum(['external', 'server']).describe('Type of agent'),
  isFavorite: z.boolean().describe('Whether to mark as favorite'),
});

// --- Skill Tools ---
export const listSkillsSchema = z.object({
  filter: z
    .enum(['all', 'system', 'user'])
    .default('all')
    .describe('Filter by skill type: system (built-in), user (custom), or all'),
  search: z
    .string()
    .optional()
    .describe('Search skills by name, description, or key'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20)
    .describe('Maximum number of skills to return (1-50)'),
});

export const getSkillSchema = z
  .object({
    skillId: z
      .string()
      .uuid()
      .optional()
      .describe('The unique ID of the skill'),
    skillKey: z
      .string()
      .optional()
      .describe('The key of the skill (e.g., "web-research")'),
  })
  .refine((data) => data.skillId || data.skillKey, {
    message: 'Either skillId or skillKey must be provided',
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

/**
 * Allowed directory prefixes for skill files.
 * Files must be in root (''), 'assets/', or 'references/' directories.
 */
const ALLOWED_SKILL_FILE_PREFIXES = ['', 'assets/', 'references/'];

/**
 * Normalize a file path without using Node's path module.
 * Handles: multiple slashes, `.` segments, and validates no `..` segments.
 * Returns null if the path is invalid.
 */
function normalizeFilePath(filePath: string): string | null {
  // Split by slash and filter out empty strings and '.' segments
  const segments = filePath.split('/').filter((s) => s !== '' && s !== '.');

  // Reject if any segment is '..' (path traversal)
  if (segments.some((s) => s === '..')) {
    return null;
  }

  // Reject if no segments remain (was empty or just '.' or '/')
  if (segments.length === 0) {
    return null;
  }

  return segments.join('/');
}

/**
 * Validate a skill file path.
 * - Must not contain path traversal sequences (..)
 * - Must not be an absolute path (start with /)
 * - Must be in an allowed directory (root, assets/, or references/)
 */
function isValidSkillFilePath(filePath: string): boolean {
  // Reject absolute paths immediately
  if (filePath.startsWith('/')) {
    return false;
  }

  // Normalize the path to handle ./file.md and multiple slashes
  const normalized = normalizeFilePath(filePath);
  if (normalized === null) {
    return false;
  }

  // Get the directory part (empty string for root files)
  const dir = normalized.includes('/')
    ? normalized.slice(0, normalized.lastIndexOf('/') + 1)
    : '';

  return ALLOWED_SKILL_FILE_PREFIXES.includes(dir);
}

/**
 * Schema for skill file path validation
 */
const SkillFilePathSchema = z
  .string()
  .min(1)
  .max(255)
  .refine(isValidSkillFilePath, {
    message: 'Path must be in root, assets/, or references/ directory',
  });

/**
 * Schema for a single skill file
 */
const SkillFileSchema = z.object({
  path: SkillFilePathSchema.describe(
    'File path within the skill (e.g., "SKILL.md" or "references/tips.md")'
  ),
  content: z.string().min(1).max(500_000).describe('File content (max 500KB)'),
});

export const createSkillSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, {
      message: 'Key must be lowercase alphanumeric with hyphens',
    })
    .describe('Unique skill key (e.g., "my-skill")'),
  name: z.string().min(1).max(255).describe('Display name for the skill'),
  description: z
    .string()
    .min(1)
    .max(1000)
    .describe('Short description for skill discovery'),
  files: z
    .array(SkillFileSchema)
    .min(1)
    .max(20)
    .describe('Documentation files (at least one, typically SKILL.md)'),
});

export const updateSkillSchema = z.object({
  id: z.string().uuid().describe('The ID of the skill to update'),
  key: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, {
      message: 'Key must be lowercase alphanumeric with hyphens',
    })
    .optional()
    .describe('New skill key'),
  name: z.string().min(1).max(255).optional().describe('New display name'),
  description: z
    .string()
    .min(1)
    .max(1000)
    .optional()
    .describe('New description'),
  files: z
    .array(SkillFileSchema)
    .min(1)
    .max(20)
    .optional()
    .describe('New documentation files (replaces all existing files)'),
});

export const deleteSkillSchema = z.object({
  id: z.string().uuid().describe('The UUID of the skill to delete'),
});

// --- Slash Command Tools ---
export const listSlashCommandsSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50)
    .describe('Maximum number of commands to return (1-100)'),
  cursor: z
    .string()
    .uuid()
    .optional()
    .describe('Cursor for pagination (ID of last item from previous page)'),
  search: z
    .string()
    .optional()
    .describe('Search filter for key, name, or description'),
});

export const getSlashCommandSchema = z
  .object({
    id: z
      .string()
      .trim()
      .uuid()
      .transform((id) => id.toLowerCase())
      .describe('The slash command ID to retrieve'),
  })
  .strict();

export const createSlashCommandSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(64)
    .regex(
      /^[a-z0-9-]+$/,
      'Key must be lowercase alphanumeric with hyphens only'
    )
    .describe('Unique command key (e.g., "code-review", "summarize")'),
  name: z.string().min(1).max(255).describe('Display name for the command'),
  description: z
    .string()
    .max(500)
    .optional()
    .describe('Brief description for autocomplete'),
  prompt: z
    .string()
    .min(1)
    .max(10000)
    .describe('The prompt template to insert when command is used'),
});

export const updateSlashCommandSchema = z
  .object({
    id: z
      .string()
      .trim()
      .uuid()
      .transform((id) => id.toLowerCase())
      .describe('The slash command ID to update'),
    key: z
      .string()
      .min(1)
      .max(64)
      .regex(
        /^[a-z0-9-]+$/,
        'Key must be lowercase alphanumeric with hyphens only'
      )
      .optional()
      .describe('New command key'),
    name: z.string().min(1).max(255).optional().describe('New display name'),
    description: z.string().max(500).optional().describe('New description'),
    prompt: z
      .string()
      .min(1)
      .max(10000)
      .optional()
      .describe('New prompt template'),
  })
  .strict();

export const deleteSlashCommandSchema = z
  .object({
    id: z
      .string()
      .trim()
      .uuid()
      .transform((id) => id.toLowerCase())
      .describe('The slash command ID to delete'),
  })
  .strict();

// =============================================================================
// Server Tool Definitions
// =============================================================================

export const SERVER_TOOL_DEFINITIONS = {
  // --- Utility Tools ---
  getTime: {
    name: 'getTime',
    description:
      'Get the current date and time. Optionally specify a timezone.',
    schema: getTimeSchema,
    category: 'utility' as const,
  },
  webSearch: {
    name: 'webSearch',
    description:
      'Search the web for current information. Use this when you need up-to-date facts, news, or information that may not be in your training data.',
    schema: webSearchSchema,
    category: 'utility' as const,
  },
  extractContent: {
    name: 'extractContent',
    description:
      'Extract the main text content from a URL. Useful for reading articles, documentation, or web pages.',
    schema: extractContentSchema,
    category: 'utility' as const,
  },
  fetch: {
    name: 'fetch',
    description:
      'Make an HTTP request to a URL. Use for APIs or when you need raw response data.',
    schema: fetchSchema,
    category: 'utility' as const,
  },

  // --- Artifact Tools ---
  writeArtifact: {
    name: 'writeArtifact',
    description:
      'Create or save a markdown document/note. Use this when the user asks you to save, write, or create a document, note, or artifact.',
    schema: writeArtifactSchema,
    category: 'artifact' as const,
  },
  searchArtifacts: {
    name: 'searchArtifacts',
    description:
      'Search for saved documents/artifacts by title or content. Use "*" to list all documents.',
    schema: searchArtifactsSchema,
    category: 'artifact' as const,
  },
  getArtifact: {
    name: 'getArtifact',
    description:
      'Read a saved document/artifact by its ID. Supports partial reads with startLine (1-indexed) and limit parameters.',
    schema: getArtifactSchema,
    category: 'artifact' as const,
  },
  updateArtifact: {
    name: 'updateArtifact',
    description:
      'Update an existing document/artifact. Can update title, content, or summary.',
    schema: updateArtifactSchema,
    category: 'artifact' as const,
  },
  patchArtifact: {
    name: 'patchArtifact',
    description:
      'Patch an artifact by replacing a specific line range with new content. Use getArtifact first to see current content and line numbers.',
    schema: patchArtifactSchema,
    category: 'artifact' as const,
  },

  // --- Project Tools ---
  listProjects: {
    name: 'listProjects',
    description:
      'List all projects available to the user. Returns project titles, summaries, and task counts.',
    schema: listProjectsSchema,
    category: 'project' as const,
  },
  searchProjects: {
    name: 'searchProjects',
    description:
      'Search for projects by title or summary. Use to find specific projects.',
    schema: searchProjectsSchema,
    category: 'project' as const,
  },
  getProject: {
    name: 'getProject',
    description:
      'Get detailed information about a specific project including all tasks.',
    schema: getProjectSchema,
    category: 'project' as const,
  },
  createProject: {
    name: 'createProject',
    description:
      'Create a new project. Projects contain tasks organized in a kanban board.',
    schema: createProjectSchema,
    category: 'project' as const,
  },
  updateProject: {
    name: 'updateProject',
    description: 'Update a project title or summary.',
    schema: updateProjectSchema,
    category: 'project' as const,
  },
  deleteProject: {
    name: 'deleteProject',
    description:
      'Delete a project and all its tasks. This action cannot be undone.',
    schema: deleteProjectSchema,
    category: 'project' as const,
  },

  // --- Task Tools ---
  listTasks: {
    name: 'listTasks',
    description:
      'List tasks in a project. Can filter by status (backlog, todo, in_progress, review, done).',
    schema: listTasksSchema,
    category: 'task' as const,
  },
  searchTasks: {
    name: 'searchTasks',
    description:
      'Search for tasks across projects. Can filter by project and status.',
    schema: searchTasksSchema,
    category: 'task' as const,
  },
  getTask: {
    name: 'getTask',
    description: 'Get detailed information about a specific task.',
    schema: getTaskSchema,
    category: 'task' as const,
  },
  createTask: {
    name: 'createTask',
    description:
      'Create a new task in a project. The task will be added to the "todo" column by default.',
    schema: createTaskSchema,
    category: 'task' as const,
  },
  updateTask: {
    name: 'updateTask',
    description: 'Update a task title, description, priority, or status.',
    schema: updateTaskSchema,
    category: 'task' as const,
  },
  deleteTask: {
    name: 'deleteTask',
    description: 'Delete a task. This action cannot be undone.',
    schema: deleteTaskSchema,
    category: 'task' as const,
  },
  moveTask: {
    name: 'moveTask',
    description:
      'Move a task to a different status/column on the kanban board.',
    schema: moveTaskSchema,
    category: 'task' as const,
  },
  reorderTask: {
    name: 'reorderTask',
    description: 'Change the position of a task within its current column.',
    schema: reorderTaskSchema,
    category: 'task' as const,
  },
  attachArtifactToTask: {
    name: 'attachArtifactToTask',
    description: 'Attach a document/artifact to a task for reference.',
    schema: attachArtifactToTaskSchema,
    category: 'task' as const,
  },
  detachArtifactFromTask: {
    name: 'detachArtifactFromTask',
    description: 'Remove an attached document/artifact from a task.',
    schema: detachArtifactFromTaskSchema,
    category: 'task' as const,
  },

  // --- Navigation Tools ---
  navigateTo: {
    name: 'navigateTo',
    description:
      'Navigate the user interface to a specific page or view. Use to help users find specific content.',
    schema: navigateToSchema,
    category: 'navigation' as const,
  },
  getCurrentUIState: {
    name: 'getCurrentUIState',
    description:
      'Get the current state of the user interface including the active page and any selected items.',
    schema: getCurrentUIStateSchema,
    category: 'navigation' as const,
  },

  // --- Agent Tools ---
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
  listAgents: {
    name: 'listAgents',
    description:
      'List all available agents that can be spawned or interacted with.',
    schema: listAgentsSchema,
    category: 'agent' as const,
  },
  getAgent: {
    name: 'getAgent',
    description: 'Get detailed information about a specific agent.',
    schema: getAgentSchema,
    category: 'agent' as const,
  },
  updateAgent: {
    name: 'updateAgent',
    description: 'Update an agent name or description.',
    schema: updateAgentSchema,
    category: 'agent' as const,
  },
  setAgentEnabled: {
    name: 'setAgentEnabled',
    description:
      'Enable or disable an agent. Disabled agents cannot be spawned.',
    schema: setAgentEnabledSchema,
    category: 'agent' as const,
  },
  toggleAgentFavorite: {
    name: 'toggleAgentFavorite',
    description: 'Mark or unmark an agent as a favorite for quick access.',
    schema: toggleAgentFavoriteSchema,
    category: 'agent' as const,
  },

  // --- Skill Usage Tools ---
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
    description: `Execute a tool using CLI-style syntax.

Command format:
  toolName --arg1 value1 --arg2 "value with spaces"

Examples:
  webSearch --query "typescript best practices"
  createTask --projectId abc123 --title "Implement feature" --priority high
  getArtifact --artifactId def456
  getTime --timezone "America/New_York"

Notes:
- Use quotes for values with spaces
- Boolean flags: --verbose (sets to true)
- Numbers are parsed automatically
- JSON objects/arrays supported in quotes`,
    schema: executeCommandSchema,
    category: 'basic' as const,
  },
  // --- Skill Authoring Tools ---
  listSkills: {
    name: 'listSkills',
    description:
      'List all available skills. Skills provide specialized capabilities and documentation.',
    schema: listSkillsSchema,
    category: 'skillManagement' as const,
  },
  getSkill: {
    name: 'getSkill',
    description:
      'Get detailed information about a specific skill including its documentation.',
    schema: getSkillSchema,
    category: 'skillManagement' as const,
  },
  createSkill: {
    name: 'createSkill',
    description:
      'Create a new skill with documentation. Skills help organize tool usage patterns.',
    schema: createSkillSchema,
    category: 'skillManagement' as const,
  },
  updateSkill: {
    name: 'updateSkill',
    description: 'Update an existing skill name, description, or content.',
    schema: updateSkillSchema,
    category: 'skillManagement' as const,
  },
  deleteSkill: {
    name: 'deleteSkill',
    description: 'Delete a skill. This action cannot be undone.',
    schema: deleteSkillSchema,
    category: 'skillManagement' as const,
  },

  // --- Slash Command Tools ---
  listSlashCommands: {
    name: 'listSlashCommands',
    description:
      'List all slash commands for the user. Returns command keys, names, descriptions, and prompts.',
    schema: listSlashCommandsSchema,
    category: 'slashCommand' as const,
  },
  getSlashCommand: {
    name: 'getSlashCommand',
    description:
      'Get a specific slash command by ID. Returns full command details including the prompt template.',
    schema: getSlashCommandSchema,
    category: 'slashCommand' as const,
  },
  createSlashCommand: {
    name: 'createSlashCommand',
    description:
      'Create a new slash command. Slash commands are reusable prompt templates that users can quickly insert in chat.',
    schema: createSlashCommandSchema,
    category: 'slashCommand' as const,
  },
  updateSlashCommand: {
    name: 'updateSlashCommand',
    description:
      'Update an existing slash command. Can update key, name, description, or prompt template.',
    schema: updateSlashCommandSchema,
    category: 'slashCommand' as const,
  },
  deleteSlashCommand: {
    name: 'deleteSlashCommand',
    description:
      'Delete a slash command permanently. This action cannot be undone.',
    schema: deleteSlashCommandSchema,
    category: 'slashCommand' as const,
  },
} as const;

// =============================================================================
// Derived Types and Exports
// =============================================================================

/**
 * All tool names derived from definitions (single source of truth)
 */
export const ALL_TOOL_NAMES = Object.keys(
  SERVER_TOOL_DEFINITIONS
) as (keyof typeof SERVER_TOOL_DEFINITIONS)[];

/**
 * Type representing any valid tool name
 */
export type ToolName = keyof typeof SERVER_TOOL_DEFINITIONS;

/**
 * Server tool names - subset accessible to remote agents
 */
export const SERVER_TOOL_NAMES = [
  'spawnAgent',
  'listSkills',
  'getSkill',
  'listSkillFiles',
  'readSkillFile',
  'executeCommand',
  'createSkill',
  'updateSkill',
  'deleteSkill',
] as const;

export type ServerToolName = (typeof SERVER_TOOL_NAMES)[number];

/**
 * Zod schema for validating server tool names
 */
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

/**
 * Get a tool definition by name
 */
export function getToolDefinition<T extends ToolName>(
  name: T
): (typeof SERVER_TOOL_DEFINITIONS)[T] {
  return SERVER_TOOL_DEFINITIONS[name];
}

/**
 * Get all tool definitions for a category
 */
export function getToolsByCategory(category: ToolCategory) {
  return Object.values(SERVER_TOOL_DEFINITIONS).filter(
    (def) => def.category === category
  );
}
