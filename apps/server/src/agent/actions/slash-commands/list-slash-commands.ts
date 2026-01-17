/**
 * listSlashCommands action
 *
 * List all slash commands for the user with pagination support.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { SlashCommandsFeature } from '../../../features/slash-commands';

export const listSlashCommandsMetadata: ActionMetadata = {
  id: 'listSlashCommands',
  requiredScopes: [AgentScope.SLASH_COMMANDS_READ],
};

/**
 * Context for list slash commands action
 */
export interface ListSlashCommandsContext {
  userId: string;
  orgId: string;
  slashCommandsFeature: SlashCommandsFeature;
}

/**
 * Create the listSlashCommands action
 */
export function createListSlashCommandsTool(
  context: ListSlashCommandsContext
): Tool {
  return tool({
    description: `List all slash commands for the user.

Slash commands are reusable prompt templates that users can quickly insert in chat.
Returns command keys, names, descriptions, and prompts with pagination support.`,

    inputSchema: z.object({
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
    }),

    execute: async ({
      limit,
      cursor,
      search,
    }: {
      limit?: number;
      cursor?: string;
      search?: string;
    }) => {
      const commandLimit = limit ?? 50;

      const result = await context.slashCommandsFeature.list({
        userId: context.userId,
        orgId: context.orgId,
        limit: commandLimit,
        cursor,
        search,
      });

      return {
        found: result.items.length > 0,
        count: result.items.length,
        nextCursor: result.nextCursor,
        results: result.items.map((command) => ({
          id: command.id,
          key: command.key,
          name: command.name,
          description: command.description,
          prompt: command.prompt,
          createdAt: command.createdAt.toISOString(),
          updatedAt: command.updatedAt.toISOString(),
        })),
      };
    },
  });
}
