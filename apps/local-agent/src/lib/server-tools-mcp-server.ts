import { createSdkMcpServer, tool } from '@anthropic-ai/claude-code';
import { z } from 'zod';
import type { ServerToolRelay } from './server-tool-relay';
import { createLogger } from './logger';

const log = createLogger('ServerToolsMcpServer');

/**
 * Format a result as an MCP tool response.
 * Returns an object with content array as expected by MCP protocol.
 */
function formatMcpResult(result: unknown) {
  let text: string;
  if (typeof result === 'string') {
    text = result;
  } else {
    try {
      text = JSON.stringify(result);
    } catch (e) {
      text = `[Serialization error: ${e instanceof Error ? e.message : 'unknown'}]`;
    }
  }
  return {
    content: [{ type: 'text' as const, text }],
  };
}

/**
 * Extract toolCallId from MCP extra context.
 * The Claude Code SDK passes tool_use block info in the extra parameter.
 */
function extractToolCallId(extra: unknown): string | undefined {
  if (!extra || typeof extra !== 'object') {
    return undefined;
  }

  const obj = extra as Record<string, unknown>;

  // Check _meta for Claude Code SDK's toolUseId
  // The SDK passes it as _meta["claudecode/toolUseId"]
  if (obj._meta && typeof obj._meta === 'object') {
    const meta = obj._meta as Record<string, unknown>;
    // Claude Code SDK pattern: _meta["claudecode/toolUseId"]
    const claudeCodeToolUseId = meta['claudecode/toolUseId'];
    if (typeof claudeCodeToolUseId === 'string') {
      return claudeCodeToolUseId;
    }
    // Fallback: check for toolUseId directly in _meta
    if (typeof meta.toolUseId === 'string') {
      return meta.toolUseId;
    }
  }

  // Fallback: check for toolUseId directly on the object
  if (typeof obj.toolUseId === 'string') {
    return obj.toolUseId;
  }

  return undefined;
}

/**
 * Creates an in-process MCP server for server tools available to remote agents.
 *
 * Remote agents only have access to:
 * - Skill tools (grepSkills, readSkillFile, executeSkill)
 * - spawnAgent (if allowedSpawnAgents is configured)
 *
 * All other functionality should be accessed via skills using executeSkill.
 *
 * @param serverRelay - The relay for communicating with the server
 * @param sessionId - The session ID for operations
 * @param messageId - The message ID for operations
 * @param allowedSpawnAgents - List of agent keys that can be spawned
 * @returns An MCP server instance that can be passed to the Claude Code SDK query()
 */
export function createServerToolsMcpServer(
  serverRelay: ServerToolRelay,
  sessionId: string,
  messageId: string,
  allowedSpawnAgents?: string[]
) {
  log.debug('Creating in-process MCP server for server tools', {
    sessionId: sessionId.slice(0, 8) + '...',
  });

  return createSdkMcpServer({
    name: 'agent-kit-server',
    version: '1.0.0',
    tools: [
      // ============= Agent Spawning =============

      ...(allowedSpawnAgents && allowedSpawnAgents.length > 0
        ? [
            tool(
              'spawnAgent',
              `Spawn another agent to handle a specific task. The spawned agent runs in its own fresh session with only the message you provide - it does not have access to your conversation history.

Use this tool to:
- Delegate specialized tasks to other agents
- Get a second opinion or alternative approach
- Run subtasks that benefit from a clean context

The tool will wait for the spawned agent to complete and return its full response.

Available agents: ${allowedSpawnAgents.join(', ')}`,
              {
                agentId: z
                  .string()
                  .min(1)
                  .max(64)
                  .regex(
                    /^[a-zA-Z0-9_-]+$/,
                    'Agent ID can only contain letters, numbers, underscores, and hyphens'
                  )
                  .describe(
                    `ID of the agent to spawn. Available: ${allowedSpawnAgents.join(', ')}`
                  ),
                message: z
                  .string()
                  .min(1)
                  .max(50000)
                  .describe('The task/message to send to the spawned agent'),
              },
              async (
                args: { agentId: string; message: string },
                extra: unknown
              ) => {
                // Extract toolCallId from MCP extra context if available
                // The SDK passes the tool_use block ID in extra._meta["claudecode/toolUseId"]
                const toolCallId = extractToolCallId(extra);

                log.debug('spawnAgent tool called', {
                  agentId: args.agentId,
                  messageLength: args.message.length,
                });

                // Validate against allowed agents
                if (!allowedSpawnAgents.includes(args.agentId)) {
                  log.warn('Spawn attempt for disallowed agent', {
                    requestedAgent: args.agentId,
                    allowedAgents: allowedSpawnAgents,
                  });
                  return formatMcpResult({
                    success: false,
                    error: `Agent '${args.agentId}' is not in the allowed spawn list. Allowed agents: ${allowedSpawnAgents.join(', ')}`,
                  });
                }

                const result = await serverRelay.executeServerTool(
                  'spawnAgent',
                  args,
                  sessionId,
                  messageId,
                  toolCallId
                );
                return formatMcpResult(result);
              }
            ),
          ]
        : []),

      // ============= Skill Tools =============

      tool(
        'grepSkills',
        'Search across skill files for content matching a pattern. Like grep -r for skills. Use to discover skills or find documentation.',
        {
          pattern: z
            .string()
            .min(1)
            .describe('Search pattern (case-insensitive substring match)'),
          skillKey: z
            .string()
            .optional()
            .describe('Optional: limit search to one skill by its key'),
        },
        async (args) => {
          log.debug('grepSkills tool called', { pattern: args.pattern });
          const result = await serverRelay.executeServerTool(
            'grepSkills',
            args,
            sessionId,
            messageId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'readSkillFile',
        'Read a skill file by path. Skills are documentation bundles that teach how to use tools. Path format: "skillKey/filePath" (e.g., "web-research/SKILL.md")',
        {
          path: z
            .string()
            .min(1)
            .describe('File path in format "skillKey/filePath"'),
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
        },
        async (args) => {
          log.debug('readSkillFile tool called', { path: args.path });
          const result = await serverRelay.executeServerTool(
            'readSkillFile',
            args,
            sessionId,
            messageId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        'executeSkill',
        'Execute a tool using CLI-style syntax. Format: toolName --arg1 value1 --arg2 "value with spaces". Example: webSearch --query "typescript best practices"',
        {
          command: z
            .string()
            .min(1)
            .describe('CLI-style command: toolName --arg1 value1'),
        },
        async (args) => {
          log.debug('executeSkill tool called', { command: args.command });
          const result = await serverRelay.executeServerTool(
            'executeSkill',
            args,
            sessionId,
            messageId
          );
          return formatMcpResult(result);
        }
      ),
    ],
  });
}
