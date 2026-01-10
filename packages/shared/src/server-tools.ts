import { z } from 'zod';

/**
 * All server tool names available via the server tool relay.
 * This is the single source of truth for tool names used by both
 * the server-side WebSocket service and the local-agent MCP server.
 *
 * Remote agents only have access to skill tools and spawnAgent.
 * All other functionality should be accessed via skills.
 */
export const SERVER_TOOL_NAMES = [
  // Agent spawning
  'spawnAgent',
  // Skill discovery tools
  'listSkills',
  'getSkill',
  // Skill tools
  'grepSkills',
  'readSkillFile',
  'executeSkill',
  // Skill management tools
  'createSkill',
  'updateSkill',
  'deleteSkill',
] as const;

/**
 * Type representing a valid server tool name.
 */
export type ServerToolName = (typeof SERVER_TOOL_NAMES)[number];

/**
 * Zod schema for validating server tool names.
 */
export const ServerToolNameSchema = z.enum(SERVER_TOOL_NAMES);

/**
 * Common parameter schemas reused across tools.
 */
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

/**
 * Schema for server tool request messages sent from agents to the server.
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
 * Schema for server tool response messages sent from the server to agents.
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
