import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import type { ServerToolRelay } from './server-tool-relay';
import { createLogger } from './logger';
import {
  SERVER_TOOL_DEFINITIONS,
  spawnAgentSchema,
  listSkillFilesSchema,
  readSkillFileSchema,
  executeCommandSchema,
} from '@agent-kit/shared';

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
 * Remote agents have access to:
 * - Skill tools (listSkillFiles, readSkillFile, executeCommand)
 * - spawnAgent (server validates permissions)
 *
 * All other functionality should be accessed via skills using executeCommand.
 *
 * @param serverRelay - The relay for communicating with the server
 * @param sessionId - The session ID for operations
 * @param messageId - The message ID for operations
 * @returns An MCP server instance that can be passed to the Claude Code SDK query()
 */
export function createServerToolsMcpServer(
  serverRelay: ServerToolRelay,
  sessionId: string,
  messageId: string
) {
  log.debug('Creating in-process MCP server for server tools', {
    sessionId: sessionId.slice(0, 8) + '...',
  });

  return createSdkMcpServer({
    name: 'agent-kit-server',
    version: '1.0.0',
    tools: [
      // ============= Agent Spawning =============
      // Name, description, and schema from shared definitions (single source of truth)

      tool(
        SERVER_TOOL_DEFINITIONS.spawnAgent.name,
        SERVER_TOOL_DEFINITIONS.spawnAgent.description,
        spawnAgentSchema.shape,
        async (args: { agentId: string; message: string }, extra: unknown) => {
          // Extract toolCallId from MCP extra context if available
          // The SDK passes the tool_use block ID in extra._meta["claudecode/toolUseId"]
          const toolCallId = extractToolCallId(extra);

          log.debug('spawnAgent tool called', {
            agentId: args.agentId,
            messageLength: args.message.length,
          });

          // Server validates permissions - no client-side validation needed
          const result = await serverRelay.executeServerTool(
            SERVER_TOOL_DEFINITIONS.spawnAgent.name as 'spawnAgent',
            args,
            sessionId,
            messageId,
            toolCallId
          );
          return formatMcpResult(result);
        }
      ),

      // ============= Skill Tools =============
      // Name, description, and schema from shared definitions (single source of truth)

      tool(
        SERVER_TOOL_DEFINITIONS.listSkillFiles.name,
        SERVER_TOOL_DEFINITIONS.listSkillFiles.description,
        listSkillFilesSchema.shape,
        async (args) => {
          log.debug('listSkillFiles tool called', { skillKey: args.skillKey });
          const result = await serverRelay.executeServerTool(
            SERVER_TOOL_DEFINITIONS.listSkillFiles.name as 'listSkillFiles',
            args,
            sessionId,
            messageId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        SERVER_TOOL_DEFINITIONS.readSkillFile.name,
        SERVER_TOOL_DEFINITIONS.readSkillFile.description,
        readSkillFileSchema.shape,
        async (args) => {
          log.debug('readSkillFile tool called', { path: args.path });
          const result = await serverRelay.executeServerTool(
            SERVER_TOOL_DEFINITIONS.readSkillFile.name as 'readSkillFile',
            args,
            sessionId,
            messageId
          );
          return formatMcpResult(result);
        }
      ),

      tool(
        SERVER_TOOL_DEFINITIONS.executeCommand.name,
        SERVER_TOOL_DEFINITIONS.executeCommand.description,
        executeCommandSchema.shape,
        async (args) => {
          log.debug('executeCommand tool called', { command: args.command });
          const result = await serverRelay.executeServerTool(
            SERVER_TOOL_DEFINITIONS.executeCommand.name as 'executeCommand',
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
