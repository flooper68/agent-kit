/**
 * updateSlashCommand action
 *
 * Update an existing slash command.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { SlashCommandsFeature } from '../../../features/slash-commands';
import { DuplicateKeyError } from '../../../features/slash-commands/commands/create-slash-command.js';
import { logger } from '../../../logger/logger';

export const updateSlashCommandMetadata: ActionMetadata = {
  id: 'updateSlashCommand',
  requiredScopes: [AgentScope.SLASH_COMMANDS_WRITE],
  needsApproval: true,
};

const log = logger.child({ module: 'update-slash-command-action' });

/**
 * Context for update slash command action
 */
export interface UpdateSlashCommandContext {
  userId: string;
  orgId: string;
  slashCommandsFeature: SlashCommandsFeature;
}

/**
 * Create the updateSlashCommand action
 */
export function createUpdateSlashCommandTool(
  context: UpdateSlashCommandContext
): Tool {
  return tool({
    description: `Update an existing slash command.

Can update key, name, description, or prompt template.
Use listSlashCommands or getSlashCommand first to find the command ID.

Note: Changing the key will change how users invoke the command.`,

    inputSchema: z
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
          .regex(/^[a-z0-9-]+$/, {
            message: 'Key must be lowercase alphanumeric with hyphens only',
          })
          .optional()
          .describe('New command key (changes how the command is invoked)'),
        name: z
          .string()
          .min(1)
          .max(255)
          .optional()
          .describe('New display name'),
        description: z
          .string()
          .max(500)
          .optional()
          .describe('New description for autocomplete'),
        prompt: z
          .string()
          .min(1)
          .max(10000)
          .optional()
          .describe('New prompt template'),
      })
      .strict(),

    execute: async ({
      id,
      key,
      name,
      description,
      prompt,
    }: {
      id: string;
      key?: string;
      name?: string;
      description?: string;
      prompt?: string;
    }) => {
      log.info('Updating slash command', { id });

      // Check that at least one field is being updated
      // Using explicit undefined checks so empty strings can be used to clear fields
      if (
        key === undefined &&
        name === undefined &&
        description === undefined &&
        prompt === undefined
      ) {
        return {
          success: false,
          error:
            'At least one field (key, name, description, or prompt) must be provided to update',
        };
      }

      try {
        const command = await context.slashCommandsFeature.update({
          userId: context.userId,
          orgId: context.orgId,
          id,
          key,
          name,
          description,
          prompt,
        });

        if (!command) {
          log.warn('Slash command not found for update', { id });
          return {
            success: false,
            error: `Slash command with ID ${id} not found`,
          };
        }

        log.info('Slash command updated', {
          commandId: command.id,
          key: command.key,
        });

        return {
          success: true,
          command: {
            id: command.id,
            key: command.key,
            name: command.name,
            description: command.description,
            prompt: command.prompt,
            createdAt: command.createdAt.toISOString(),
            updatedAt: command.updatedAt.toISOString(),
          },
          message: `Slash command "/${command.key}" updated successfully.`,
        };
      } catch (error) {
        // Check for duplicate key error
        if (error instanceof DuplicateKeyError) {
          log.warn('Slash command key already exists', { key });
          return {
            success: false,
            error: `A slash command with key "${key}" already exists. Choose a different key.`,
          };
        }
        log.error('Failed to update slash command', { error });
        return {
          success: false,
          error: 'Failed to update slash command',
        };
      }
    },
  });
}
