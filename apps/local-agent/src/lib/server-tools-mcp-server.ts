import { createSdkMcpServer, tool } from '@anthropic-ai/claude-code';
import { z } from 'zod';
import { TaskStatusSchema, TaskPrioritySchema } from '@agent-kit/shared';
import type { ServerToolRelay } from './server-tool-relay';
import { createLogger } from './logger';

const log = createLogger('ServerToolsMcpServer');

/**
 * Format a result as an MCP tool response.
 * Returns an object with content array as expected by MCP protocol.
 */
function formatMcpResult(result: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: typeof result === 'string' ? result : JSON.stringify(result),
      },
    ],
  };
}

/**
 * Creates an in-process MCP server for all server tools.
 *
 * This uses `createSdkMcpServer()` from the Claude Code SDK which allows
 * tools to run in the same process as the local agent, enabling direct
 * access to the server relay without IPC.
 *
 * @param serverRelay - The relay for communicating with the server
 * @param sessionId - The session ID for operations
 * @returns An MCP server instance that can be passed to the Claude Code SDK query()
 */
export function createServerToolsMcpServer(
  serverRelay: ServerToolRelay,
  sessionId: string
) {
  log.debug('Creating in-process MCP server for server tools', {
    sessionId: sessionId.slice(0, 8) + '...',
  });

  return createSdkMcpServer({
    name: 'agent-kit-server',
    version: '1.0.0',
    tools: [
      // ============= Static Tools =============

      tool(
        'webSearch',
        'Search the web for current information. Use this when you need up-to-date facts, news, or information.',
        {
          query: z.string().min(1).max(500).describe('The search query'),
          maxResults: z
            .number()
            .min(1)
            .max(10)
            .default(5)
            .describe('Maximum number of results to return'),
          topic: z
            .enum(['general', 'news', 'finance'])
            .optional()
            .describe('Topic category to focus the search'),
        },
        async (args) => {
          log.debug('webSearch tool called', { query: args.query });
          const result = await serverRelay.executeServerTool(
            'webSearch',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'fetch',
        'Fetch raw content from a public URL using HTTP GET. Use this for APIs, JSON endpoints, or when you need the exact response.',
        {
          url: z
            .string()
            .url()
            .describe('The public URL to fetch (no private/internal URLs)'),
        },
        async (args) => {
          log.debug('fetch tool called', { url: args.url });
          const result = await serverRelay.executeServerTool(
            'fetch',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      // ============= Artifact Tools =============

      tool(
        'writeArtifact',
        'Create or save a markdown document/note to the server. Use this when the user asks you to save, write, or create a document, note, or artifact.',
        {
          title: z
            .string()
            .min(1)
            .max(255)
            .describe('The title of the document (1-255 characters)'),
          content: z
            .string()
            .min(1)
            .max(1_000_000)
            .describe('The markdown content of the document (max 1MB)'),
          summary: z
            .string()
            .max(500)
            .optional()
            .describe(
              'A brief 1-2 sentence summary of the content for search purposes (max 500 characters)'
            ),
        },
        async (args) => {
          log.debug('writeArtifact tool called', {
            titleLength: args.title.length,
            contentLength: args.content.length,
          });
          const result = await serverRelay.executeServerTool(
            'writeArtifact',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'readArtifact',
        'Read the full content of a saved document by its ID. Use this after searching to retrieve the complete document content.',
        {
          artifactId: z
            .string()
            .uuid()
            .describe('The UUID of the document to read'),
        },
        async (args) => {
          log.debug('readArtifact tool called', {
            artifactId: args.artifactId.slice(0, 8) + '...',
          });
          const result = await serverRelay.executeServerTool(
            'readArtifact',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'searchArtifacts',
        'Search through saved documents/notes by title and summary. Use an empty query to list recent documents.',
        {
          query: z
            .string()
            .describe('Search query (empty string to list recent documents)'),
          limit: z
            .number()
            .optional()
            .default(10)
            .describe('Maximum number of results to return (default: 10)'),
          offset: z
            .number()
            .optional()
            .default(0)
            .describe('Number of results to skip for pagination (default: 0)'),
        },
        async (args) => {
          log.debug('searchArtifacts tool called', {
            queryLength: args.query.length,
          });
          const result = await serverRelay.executeServerTool(
            'searchArtifacts',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      // ============= Project Tools =============

      tool(
        'listProjects',
        'List all projects available to the user. Returns project titles, summaries, and task counts.',
        {
          limit: z
            .number()
            .min(1)
            .max(50)
            .default(20)
            .describe('Maximum number of projects to return'),
        },
        async (args) => {
          log.debug('listProjects tool called', { limit: args.limit });
          const result = await serverRelay.executeServerTool(
            'listProjects',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'searchProjects',
        'Search for projects by title or summary. Returns matching projects with their task counts.',
        {
          query: z
            .string()
            .min(1)
            .describe(
              'Search query to match against project titles and summaries'
            ),
          limit: z
            .number()
            .min(1)
            .max(20)
            .default(10)
            .describe('Maximum number of results'),
        },
        async (args) => {
          log.debug('searchProjects tool called', { query: args.query });
          const result = await serverRelay.executeServerTool(
            'searchProjects',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'getProject',
        'Get detailed information about a specific project by ID, including task counts and recent tasks.',
        {
          projectId: z
            .string()
            .uuid()
            .describe('The unique ID of the project to retrieve'),
        },
        async (args) => {
          log.debug('getProject tool called', {
            projectId: args.projectId.slice(0, 8) + '...',
          });
          const result = await serverRelay.executeServerTool(
            'getProject',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'createProject',
        'Create a new project for organizing tasks. Projects contain a Kanban board with todo, in_progress, review, and done columns.',
        {
          title: z.string().min(1).max(255).describe('The project title'),
          summary: z
            .string()
            .max(1000)
            .optional()
            .describe('Optional project summary or description'),
        },
        async (args) => {
          log.debug('createProject tool called', { title: args.title });
          const result = await serverRelay.executeServerTool(
            'createProject',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'updateProject',
        'Update an existing project. You can change the title and/or summary.',
        {
          projectId: z
            .string()
            .uuid()
            .describe('The ID of the project to update'),
          title: z
            .string()
            .min(1)
            .max(255)
            .optional()
            .describe('New project title'),
          summary: z
            .string()
            .max(1000)
            .nullable()
            .optional()
            .describe('New project summary (set to null to remove)'),
        },
        async (args) => {
          log.debug('updateProject tool called', {
            projectId: args.projectId.slice(0, 8) + '...',
          });
          const result = await serverRelay.executeServerTool(
            'updateProject',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'deleteProject',
        'Delete a project and all its tasks. This action is permanent and cannot be undone.',
        {
          projectId: z
            .string()
            .uuid()
            .describe('The ID of the project to delete'),
        },
        async (args) => {
          log.debug('deleteProject tool called', {
            projectId: args.projectId.slice(0, 8) + '...',
          });
          const result = await serverRelay.executeServerTool(
            'deleteProject',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      // ============= Task Tools =============

      tool(
        'listTasks',
        'List tasks in a project with optional filters. Can filter by status, priority, or tasks with artifacts.',
        {
          projectId: z
            .string()
            .uuid()
            .describe('The project ID to list tasks from'),
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
        },
        async (args) => {
          log.debug('listTasks tool called', {
            projectId: args.projectId.slice(0, 8) + '...',
          });
          const result = await serverRelay.executeServerTool(
            'listTasks',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'searchTasks',
        'Search for tasks across all projects by title or description. Returns matching tasks with their project information.',
        {
          query: z
            .string()
            .min(1)
            .describe(
              'Search query to match against task titles and descriptions'
            ),
          limit: z
            .number()
            .min(1)
            .max(50)
            .default(20)
            .describe('Maximum number of results'),
        },
        async (args) => {
          log.debug('searchTasks tool called', { query: args.query });
          const result = await serverRelay.executeServerTool(
            'searchTasks',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'getTask',
        'Get detailed information about a specific task by ID, including attached artifacts and event history.',
        {
          taskId: z
            .string()
            .uuid()
            .describe('The unique ID of the task to retrieve'),
        },
        async (args) => {
          log.debug('getTask tool called', {
            taskId: args.taskId.slice(0, 8) + '...',
          });
          const result = await serverRelay.executeServerTool(
            'getTask',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'createTask',
        'Create a new task in a project. The task will be added to the "todo" column by default.',
        {
          projectId: z
            .string()
            .uuid()
            .describe('The project ID to create the task in'),
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
        },
        async (args) => {
          log.debug('createTask tool called', { title: args.title });
          const result = await serverRelay.executeServerTool(
            'createTask',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'updateTask',
        'Update task details like title, description, or priority. Use moveTask to change the task status.',
        {
          taskId: z.string().uuid().describe('The task ID to update'),
          title: z
            .string()
            .min(1)
            .max(255)
            .optional()
            .describe('New task title'),
          description: z
            .string()
            .max(5000)
            .nullable()
            .optional()
            .describe('New task description (null to clear)'),
          priority: TaskPrioritySchema.optional().describe(
            'New priority: low, medium, high, or urgent'
          ),
        },
        async (args) => {
          log.debug('updateTask tool called', {
            taskId: args.taskId.slice(0, 8) + '...',
          });
          const result = await serverRelay.executeServerTool(
            'updateTask',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'deleteTask',
        'Delete a task. This action is permanent and cannot be undone. Any attached artifacts will be unlinked but not deleted.',
        {
          taskId: z.string().uuid().describe('The ID of the task to delete'),
        },
        async (args) => {
          log.debug('deleteTask tool called', {
            taskId: args.taskId.slice(0, 8) + '...',
          });
          const result = await serverRelay.executeServerTool(
            'deleteTask',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'moveTask',
        'Move a task to a different status column (backlog, todo, in_progress, review, done). Use this to update task progress.',
        {
          taskId: z.string().uuid().describe('The task ID to move'),
          status: TaskStatusSchema.describe(
            'The new status: backlog, todo, in_progress, review, or done'
          ),
          position: z
            .number()
            .min(0)
            .default(0)
            .describe('Position in the column (0 = top). Defaults to top.'),
        },
        async (args) => {
          log.debug('moveTask tool called', {
            taskId: args.taskId.slice(0, 8) + '...',
            status: args.status,
          });
          const result = await serverRelay.executeServerTool(
            'moveTask',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'reorderTask',
        'Reorder a task within its current status column. Use this to change the priority/order of tasks without changing their status.',
        {
          taskId: z.string().uuid().describe('The task ID to reorder'),
          position: z
            .number()
            .min(0)
            .describe(
              'New position in the column (0 = top, higher numbers = lower in the list)'
            ),
        },
        async (args) => {
          log.debug('reorderTask tool called', {
            taskId: args.taskId.slice(0, 8) + '...',
            position: args.position,
          });
          const result = await serverRelay.executeServerTool(
            'reorderTask',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'attachArtifactToTask',
        'Attach an artifact (document) to a task. This links the artifact to the task for reference.',
        {
          taskId: z
            .string()
            .uuid()
            .describe('The task ID to attach the artifact to'),
          artifactId: z.string().uuid().describe('The artifact ID to attach'),
        },
        async (args) => {
          log.debug('attachArtifactToTask tool called', {
            taskId: args.taskId.slice(0, 8) + '...',
            artifactId: args.artifactId.slice(0, 8) + '...',
          });
          const result = await serverRelay.executeServerTool(
            'attachArtifactToTask',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'detachArtifactFromTask',
        'Detach an artifact (document) from a task. This removes the link between the artifact and the task.',
        {
          taskId: z
            .string()
            .uuid()
            .describe('The task ID to detach the artifact from'),
          artifactId: z.string().uuid().describe('The artifact ID to detach'),
        },
        async (args) => {
          log.debug('detachArtifactFromTask tool called', {
            taskId: args.taskId.slice(0, 8) + '...',
            artifactId: args.artifactId.slice(0, 8) + '...',
          });
          const result = await serverRelay.executeServerTool(
            'detachArtifactFromTask',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      // ============= Client/UI Tools =============

      tool(
        'navigateTo',
        "Navigate the user's browser to a specific route within the application. Use this to direct users to relevant pages like projects, artifacts, or settings.",
        {
          path: z
            .string()
            .min(1)
            .describe(
              'Application route path (e.g., "/app/projects", "/app/artifacts", "/app/agents")'
            ),
        },
        async (args) => {
          log.debug('navigateTo tool called', { path: args.path });
          const result = await serverRelay.executeServerTool(
            'navigateTo',
            args,
            sessionId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'getCurrentUIState',
        "Get the current UI state of the user's browser, including the current path, page title, and route parameters. Use this to understand what the user is currently looking at.",
        {},
        async () => {
          log.debug('getCurrentUIState tool called');
          const result = await serverRelay.executeServerTool(
            'getCurrentUIState',
            {},
            sessionId
          );
          return formatMcpResult(result);
        }
      ),
    ],
  });
}
