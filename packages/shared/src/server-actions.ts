import { z } from 'zod';

// =============================================================================
// Common Schemas (shared with tools)
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
export const WebSearchTopicSchema = z.enum(['general', 'news', 'finance']);

// Tavily extract format schema
export const TavilyExtractFormatSchema = z.enum(['markdown', 'text']);

// =============================================================================
// Action Categories
// =============================================================================

export type ActionCategory =
  | 'utility'
  | 'artifact'
  | 'project'
  | 'task'
  | 'navigation'
  | 'agent'
  | 'skillManagement';

// =============================================================================
// Action Definition Type
// =============================================================================

export interface ActionDefinition<T extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  schema: T;
  category: ActionCategory;
}

// =============================================================================
// Utility Action Schemas
// =============================================================================

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
  urls: z
    .array(z.string().url())
    .min(1)
    .max(5)
    .describe('URLs to extract content from'),
  format: TavilyExtractFormatSchema.default('markdown').describe(
    'Output format for extracted content'
  ),
});

export const fetchSchema = z.object({
  url: z
    .string()
    .url()
    .describe('The public URL to fetch (no private/internal URLs)'),
});

// =============================================================================
// Artifact Action Schemas
// =============================================================================

export const writeArtifactSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less')
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
    .describe(
      'Search query to match against document titles and summaries. Use empty string to list recent documents.'
    ),
  limit: z
    .number()
    .optional()
    .default(10)
    .describe('Maximum number of results to return'),
  offset: z
    .number()
    .optional()
    .default(0)
    .describe('Number of results to skip for pagination'),
});

export const readArtifactSchema = z.object({
  artifactId: z.string().uuid().describe('The artifact ID to read'),
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

// =============================================================================
// Project Action Schemas
// =============================================================================

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

// =============================================================================
// Task Action Schemas
// =============================================================================

export const listTasksSchema = z.object({
  projectId: z.string().uuid().describe('The project ID to list tasks from'),
  status: z
    .array(TaskStatusSchema)
    .optional()
    .describe(
      'Filter by task status(es): backlog, todo, in_progress, review, done'
    ),
  priority: z
    .array(TaskPrioritySchema)
    .optional()
    .describe('Filter by priority: low, medium, high, urgent'),
  hasArtifacts: z
    .boolean()
    .optional()
    .describe('Only show tasks with attached artifacts'),
});

export const searchTasksSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe('Search query to match against task titles and descriptions'),
  limit: z
    .number()
    .min(1)
    .max(50)
    .default(20)
    .describe('Maximum number of results'),
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
  description: z
    .string()
    .max(5000)
    .nullable()
    .optional()
    .describe('New task description (null to clear)'),
  priority: TaskPrioritySchema.optional().describe(
    'New priority: low, medium, high, or urgent'
  ),
});

export const deleteTaskSchema = z.object({
  taskId: z.string().uuid().describe('The task ID to delete'),
});

export const moveTaskSchema = z.object({
  taskId: z.string().uuid().describe('The task ID to move'),
  status: TaskStatusSchema.describe(
    'The new status: backlog, todo, in_progress, review, or done'
  ),
  position: z
    .number()
    .min(0)
    .default(0)
    .describe('Position in the column (0 = top). Defaults to top.'),
});

export const reorderTaskSchema = z.object({
  taskId: z.string().uuid().describe('The task ID to reorder'),
  position: z
    .number()
    .min(0)
    .describe(
      'New position in the column (0 = top, higher numbers = lower in the list)'
    ),
});

export const attachArtifactToTaskSchema = z.object({
  taskId: z.string().uuid().describe('The task ID'),
  artifactId: z.string().uuid().describe('The artifact ID to attach'),
});

export const detachArtifactFromTaskSchema = z.object({
  taskId: z.string().uuid().describe('The task ID'),
  artifactId: z.string().uuid().describe('The artifact ID to detach'),
});

// =============================================================================
// Navigation Action Schemas
// =============================================================================

export const navigateToSchema = z.object({
  path: z
    .string()
    .min(1)
    .regex(/^\/(?![/\\])/, 'Path must start with a single forward slash')
    .refine(
      (path) => !path.includes('://') && !path.includes('//'),
      'Path cannot contain protocol or double slashes'
    )
    .describe(
      'Application route path (e.g., "/app/projects", "/app/artifacts", "/app/agents", "/app/analytics")'
    ),
});

export const getCurrentUIStateSchema = z.object({});

// =============================================================================
// Agent Action Schemas
// =============================================================================

export const listAgentsSchema = z.object({
  type: z
    .enum(['external', 'server', 'all'])
    .default('all')
    .describe(
      'Filter by agent type: external (WebSocket-based), server (LLM-based), or all'
    ),
  includeDisabled: z
    .boolean()
    .default(false)
    .describe('Include disabled agents in the list'),
});

export const getAgentSchema = z.object({
  agentId: z.string().uuid().describe('The unique ID of the agent'),
  agentType: z
    .enum(['external', 'server'])
    .describe(
      'The type of agent: external (WebSocket-based) or server (LLM-based)'
    ),
});

export const updateAgentSchema = z.object({
  agentId: z.string().uuid().describe('The unique ID of the agent'),
  agentType: z
    .enum(['server'])
    .describe('Only server agents can be updated via this action'),
  name: z.string().min(1).max(255).optional().describe('New agent name'),
  description: z.string().max(2000).optional().describe('New description'),
});

export const setAgentEnabledSchema = z.object({
  agentId: z.string().uuid().describe('The unique ID of the agent'),
  agentType: z
    .enum(['external', 'server'])
    .describe(
      'The type of agent: external (WebSocket-based) or server (LLM-based)'
    ),
  enabled: z
    .boolean()
    .describe('Set to true to enable the agent, false to disable'),
});

export const toggleAgentFavoriteSchema = z.object({
  agentId: z.string().uuid().describe('The unique ID of the agent'),
  agentType: z
    .enum(['external', 'server'])
    .describe(
      'The type of agent: external (WebSocket-based) or server (LLM-based)'
    ),
  isFavorite: z
    .boolean()
    .describe(
      'Set to true to mark as favorite, false to remove from favorites'
    ),
});

// =============================================================================
// Skill Management Action Schemas
// =============================================================================

/**
 * Valid file paths within a skill directory.
 * Allows: SKILL.md, simple names, and nested paths like references/tips.md
 * Disallows: absolute paths, ../, hidden files, etc.
 */
export const SkillFilePathSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(
    /^(?!\.)[a-zA-Z0-9][a-zA-Z0-9._-]*(?:\/(?!\.)[a-zA-Z0-9][a-zA-Z0-9._-]*)*$/,
    'Invalid file path. Use simple paths like "SKILL.md" or "references/tips.md"'
  )
  .refine(
    (path) => !path.includes('..') && !path.startsWith('/'),
    'Path cannot contain ".." or start with "/"'
  );

/**
 * Schema for skill file input with path validation
 */
export const SkillFileSchema = z.object({
  path: SkillFilePathSchema.describe(
    'File path within the skill (e.g., "SKILL.md" or "references/tips.md")'
  ),
  content: z.string().min(1).max(500_000).describe('File content (max 500KB)'),
});

export const listSkillsSchema = z.object({
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(50)
    .describe('Maximum number of skills to return'),
});

export const getSkillSchema = z.object({
  skillKey: z.string().min(1).describe('The skill key to retrieve'),
});

export const createSkillSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, {
      message: 'Key must contain only lowercase letters, numbers, and hyphens',
    })
    .describe('Unique skill identifier (e.g., "my-custom-skill")'),
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
      message: 'Key must contain only lowercase letters, numbers, and hyphens',
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
  id: z.string().uuid().describe('The ID of the skill to delete'),
});

// =============================================================================
// Action Definitions
// =============================================================================

export const ACTION_DEFINITIONS = {
  // --- Utility Actions ---
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

  // --- Artifact Actions ---
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
      'Search for saved documents/artifacts by title or content. Use to find existing notes or documents.',
    schema: searchArtifactsSchema,
    category: 'artifact' as const,
  },
  readArtifact: {
    name: 'readArtifact',
    description:
      'Read the full content of a saved document/artifact by its ID.',
    schema: readArtifactSchema,
    category: 'artifact' as const,
  },
  updateArtifact: {
    name: 'updateArtifact',
    description:
      'Update an existing document/artifact. Can update title, content, or summary.',
    schema: updateArtifactSchema,
    category: 'artifact' as const,
  },

  // --- Project Actions ---
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

  // --- Task Actions ---
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

  // --- Navigation Actions ---
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

  // --- Agent Actions ---
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

  // --- Skill Management Actions ---
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
} as const;

// =============================================================================
// Derived Types and Exports
// =============================================================================

/**
 * All action names derived from definitions (single source of truth)
 */
export const ALL_ACTION_NAMES = Object.keys(
  ACTION_DEFINITIONS
) as (keyof typeof ACTION_DEFINITIONS)[];

/**
 * Type representing any valid action name
 */
export type ActionName = keyof typeof ACTION_DEFINITIONS;

/**
 * Get an action definition by name
 */
export function getActionDefinition<T extends ActionName>(
  name: T
): (typeof ACTION_DEFINITIONS)[T] {
  return ACTION_DEFINITIONS[name];
}

/**
 * Get all action definitions for a category
 */
export function getActionsByCategory(category: ActionCategory) {
  return Object.values(ACTION_DEFINITIONS).filter(
    (def) => def.category === category
  );
}

/**
 * List all action names
 */
export function listActionNames(): ActionName[] {
  return ALL_ACTION_NAMES;
}
