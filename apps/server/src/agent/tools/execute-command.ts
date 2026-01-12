/**
 * executeCommand tool
 *
 * Executes tools using CLI-style command strings.
 * This provides a natural interface for running tools.
 *
 * Examples:
 *   webSearch --query "typescript tutorials"
 *   createTask --projectId abc123 --title "New task" --priority high
 *   getTime --timezone "America/New_York"
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { ExecuteSkillResult, ParsedCommand } from '../skills/types';
import { getActionsById } from '../actions';
import type { ToolsContext } from './types';
import { logger } from '../logger';
import { SERVER_TOOL_DEFINITIONS, type ToolName } from '@agent-kit/shared';
import { checkActionPermission, createPermissionError } from '../permissions';

const log = logger.child({ module: 'execute-command-tool' });

export interface ExecuteCommandToolContext {
  /** Tool context for creating actual tools */
  toolContext: ToolsContext;
}

/**
 * Parse a CLI-style command string into tool name and arguments
 *
 * Supports:
 * - --arg value
 * - --arg "value with spaces"
 * - --arg 'value with spaces'
 * - --flag (boolean true)
 * - Numeric values are parsed as numbers
 * - JSON objects/arrays in quotes
 */
export function parseCommand(command: string): ParsedCommand {
  const tokens = tokenize(command);

  if (tokens.length === 0) {
    throw new Error('Empty command');
  }

  const toolName = tokens[0];
  if (!toolName || toolName.startsWith('-')) {
    throw new Error('Command must start with tool name');
  }

  const args: Record<string, unknown> = {};
  let i = 1;

  while (i < tokens.length) {
    const token = tokens[i];

    if (!token) {
      i++;
      continue;
    }

    if (token.startsWith('--')) {
      const argName = token.slice(2);
      const nextToken = tokens[i + 1];

      // Check if next token is a value or another flag
      if (nextToken === undefined || nextToken.startsWith('--')) {
        // Boolean flag
        args[argName] = true;
        i++;
      } else {
        // Value follows
        args[argName] = parseValue(nextToken);
        i += 2;
      }
    } else if (token.startsWith('-')) {
      // Short flag (e.g., -v)
      const argName = token.slice(1);
      const nextToken = tokens[i + 1];

      if (nextToken === undefined || nextToken.startsWith('-')) {
        args[argName] = true;
        i++;
      } else {
        args[argName] = parseValue(nextToken);
        i += 2;
      }
    } else {
      // Positional argument (skip for now, could add support later)
      i++;
    }
  }

  return { tool: toolName, args };
}

/**
 * Tokenize a command string, respecting quotes
 */
function tokenize(command: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote: string | null = null;
  let i = 0;

  while (i < command.length) {
    const char = command[i];

    if (inQuote) {
      // Inside quotes
      if (char === inQuote) {
        // End of quoted string
        tokens.push(current);
        current = '';
        inQuote = null;
      } else if (char === '\\' && i + 1 < command.length) {
        // Escape sequence
        const nextChar = command[i + 1];
        if (nextChar === inQuote || nextChar === '\\') {
          current += nextChar;
          i++;
        } else {
          current += char;
        }
      } else {
        current += char;
      }
    } else {
      // Outside quotes
      if (char === '"' || char === "'") {
        // Start of quoted string
        if (current) {
          tokens.push(current);
          current = '';
        }
        inQuote = char;
      } else if (char === ' ' || char === '\t') {
        // Whitespace separator
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    i++;
  }

  // Handle unterminated quote
  if (inQuote) {
    throw new Error(`Unterminated ${inQuote} quote in command`);
  }

  // Add final token
  if (current) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Parse a value string into appropriate type
 */
function parseValue(value: string): unknown {
  // Try to parse as JSON (for objects, arrays, booleans, null)
  if (
    value.startsWith('{') ||
    value.startsWith('[') ||
    value === 'true' ||
    value === 'false' ||
    value === 'null'
  ) {
    try {
      return JSON.parse(value);
    } catch {
      // Not valid JSON, return as string
    }
  }

  // Try to parse as number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return num;
    }
  }

  // Return as string
  return value;
}

/**
 * Create the executeCommand tool
 */
export function createExecuteCommandTool(
  context: ExecuteCommandToolContext
): Tool {
  return tool({
    // Use shared description from @agent-kit/shared (single source of truth)
    description: SERVER_TOOL_DEFINITIONS.executeCommand.description,
    // Schema inlined to avoid TypeScript recursion issues with AI SDK type inference
    inputSchema: z.object({
      command: z
        .string()
        .min(1)
        .describe(
          'CLI-style command: toolName --arg1 value1 --arg2 "value with spaces"'
        ),
    }),

    execute: async ({
      command,
    }: {
      command: string;
    }): Promise<ExecuteSkillResult> => {
      log.info('Executing command', { command });

      // Parse the command
      let parsed: ParsedCommand;
      try {
        parsed = parseCommand(command);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to parse command';
        log.warn('Command parse error', { command, error: errorMessage });
        return {
          success: false,
          tool: '',
          args: {},
          error: `Parse error: ${errorMessage}`,
        };
      }

      const { tool: toolName, args } = parsed;

      // Check permissions before instantiating the action
      const permCheck = checkActionPermission(
        toolName,
        context.toolContext.agentScopes
      );
      if (!permCheck.allowed) {
        log.warn('Permission denied', {
          actionName: toolName,
          missingScopes: permCheck.missingScopes,
        });
        return {
          success: false,
          tool: toolName,
          args,
          error: createPermissionError(toolName, permCheck.missingScopes),
        };
      }

      // Get the action implementation (only after permission check passes)
      const actions = getActionsById([toolName], context.toolContext);
      const actionImpl = actions[toolName];

      if (!actionImpl) {
        log.warn('Action not found', { actionName: toolName });
        return {
          success: false,
          tool: toolName,
          args,
          error: `Action "${toolName}" not found or not available.`,
        };
      }

      // Validate args against schema before execution
      const toolDef = SERVER_TOOL_DEFINITIONS[toolName as ToolName];
      if (toolDef?.schema) {
        const validationResult = toolDef.schema.safeParse(args);
        if (!validationResult.success) {
          const errors = validationResult.error.issues
            .map((issue) => `${issue.path.join('.') || 'argument'}: ${issue.message}`)
            .join(', ');

          log.warn('Argument validation failed', {
            actionName: toolName,
            args,
            errors,
          });

          return {
            success: false,
            tool: toolName,
            args,
            error: `Invalid arguments for ${toolName}: ${errors}. Check parameter names and types.`,
          };
        }
      }

      // Execute the action
      try {
        log.info('Executing action', { actionName: toolName, args });

        const result = await actionImpl.execute(args);

        log.info('Action execution completed', {
          actionName: toolName,
          success: true,
        });

        return {
          success: true,
          tool: toolName,
          args,
          result,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error during execution';
        log.error('Action execution failed', {
          actionName: toolName,
          args,
          error: errorMessage,
        });

        return {
          success: false,
          tool: toolName,
          args,
          error: errorMessage,
        };
      }
    },
  });
}
