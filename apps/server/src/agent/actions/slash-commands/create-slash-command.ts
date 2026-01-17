/**
 * createSlashCommand action
 *
 * Create a new slash command (reusable prompt template).
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { SlashCommandsFeature } from '../../../features/slash-commands';
import { logger } from '../../../logger/logger';

export const createSlashCommandMetadata: ActionMetadata = {
  id: 'createSlashCommand',
  requiredScopes: [AgentScope.SLASH_COMMANDS_WRITE],
  needsApproval: true,
};

const log = logger.child({ module: 'create-slash-command-action' });

/**
 * Context for create slash command action
 */
export interface CreateSlashCommandContext {
  userId: string;
  orgId: string;
  slashCommandsFeature: SlashCommandsFeature;
}

/**
 * Create the createSlashCommand action
 */
export function createCreateSlashCommandTool(
  context: CreateSlashCommandContext
): Tool {
  return tool({
    description: `Create a new slash command.

Slash commands are reusable prompt templates that users can quickly insert in chat.
The key must be unique and will be used to invoke the command (e.g., /code-review).

Best practices:
- Use descriptive, lowercase keys with hyphens (e.g., "code-review", "summarize-doc")
- Include a clear description for autocomplete suggestions
- Write prompts that are reusable and can work with different contexts`,

    inputSchema: z.object({
      key: z
        .string()
        .min(1)
        .max(64)
        .regex(/^[a-z0-9-]+$/, {
          message: 'Key must be lowercase alphanumeric with hyphens only',
        })
        .describe(
          'Unique command key (e.g., "code-review", "summarize"). Used to invoke the command.'
        ),
      name: z
        .string()
        .min(1)
        .max(255)
        .describe('Display name for the command (e.g., "Code Review")'),
      description: z
        .string()
        .max(500)
        .optional()
        .describe(
          'Brief description shown in autocomplete (e.g., "Review code for bugs and best practices")'
        ),
      prompt: z
        .string()
        .min(1)
        .max(10000)
        .describe(
          'The prompt template to insert when the command is used. Can include instructions, context, or placeholders.'
        ),
    }),

    execute: async ({
      key,
      name,
      description,
      prompt,
    }: {
      key: string;
      name: string;
      description?: string;
      prompt: string;
    }) => {
      log.info('Creating slash command', { key, name });

      try {
        const command = await context.slashCommandsFeature.create({
          userId: context.userId,
          orgId: context.orgId,
          key,
          name,
          description,
          prompt,
        });

        log.info('Slash command created', { commandId: command.id, key });

        return {
          success: true,
          commandId: command.id,
          message: `Slash command "/${key}" created successfully. Users can now use it in chat.`,
        };
      } catch (error) {
        // Check for unique constraint violation
        if (
          error instanceof Error &&
          error.message.includes('unique constraint')
        ) {
          log.warn('Slash command key already exists', { key });
          return {
            success: false,
            error: `A slash command with key "${key}" already exists. Choose a different key.`,
          };
        }

        log.error('Error creating slash command', { error, key });
        return {
          success: false,
          error: 'Failed to create slash command',
        };
      }
    },
  });
}
