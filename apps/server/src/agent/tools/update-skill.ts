/**
 * updateSkill tool
 *
 * Update an existing user skill.
 * System skills cannot be modified through this tool.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { SkillsFeature } from '../../features/skills';
import { logger } from '../logger';

const log = logger.child({ module: 'update-skill-tool' });

/**
 * Context for update skill tool
 */
export interface UpdateSkillToolContext {
  userId: string;
  orgId: string;
  skillsFeature: SkillsFeature;
}

/**
 * Schema for skill file input
 */
const SkillFileSchema = z.object({
  path: z.string().min(1).max(255).describe('File path within the skill'),
  content: z.string().min(1).max(500_000).describe('File content (max 500KB)'),
});

/**
 * Create the updateSkill tool
 */
export function createUpdateSkillTool(context: UpdateSkillToolContext): Tool {
  return tool({
    description: `Update an existing user skill.

You can update the key, name, description, and/or files.
System skills cannot be modified - only user-created skills can be updated.`,

    inputSchema: z.object({
      id: z.string().uuid().describe('The ID of the skill to update'),
      key: z
        .string()
        .min(1)
        .max(64)
        .regex(/^[a-z0-9-]+$/, {
          message:
            'Key must contain only lowercase letters, numbers, and hyphens',
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
    }),

    execute: async ({
      id,
      key,
      name,
      description,
      files,
    }: {
      id: string;
      key?: string;
      name?: string;
      description?: string;
      files?: Array<{ path: string; content: string }>;
    }) => {
      log.info('Updating skill', {
        id,
        hasKey: !!key,
        hasName: !!name,
        hasFiles: !!files,
      });

      try {
        const skill = await context.skillsFeature.update({
          id,
          userId: context.userId,
          orgId: context.orgId,
          key,
          name,
          description,
          files,
        });

        if (!skill) {
          log.warn('Skill not found or not updatable', { id });
          return {
            success: false,
            error:
              'Skill not found or you do not have permission to update it. Note: System skills cannot be modified.',
          };
        }

        log.info('Skill updated', { skillId: skill.id, key: skill.key });

        return {
          success: true,
          skill: {
            id: skill.id,
            key: skill.key,
            name: skill.name,
            description: skill.description,
            fileCount: (skill.files as Array<{ path: string; content: string }>)
              .length,
          },
          message: `Skill "${skill.name}" updated successfully.`,
        };
      } catch (error) {
        log.error('Error updating skill', { error, id });

        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        if (
          errorMessage.includes('unique') ||
          errorMessage.includes('duplicate')
        ) {
          return {
            success: false,
            error: `A skill with key "${key}" already exists. Choose a different key.`,
          };
        }

        return {
          success: false,
          error: 'Failed to update skill',
        };
      }
    },
  });
}
