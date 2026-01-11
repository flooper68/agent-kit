/**
 * updateSkill action
 *
 * Update an existing user skill.
 * System skills cannot be modified through this action.
 */

import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { SkillsFeature } from '../../features/skills';
import { logger } from '../shared/logger';
import { updateSkillSchema } from '@agent-kit/shared';

const log = logger.child({ module: 'update-skill-action' });

/**
 * Context for update skill action
 */
export interface UpdateSkillActionContext {
  userId: string;
  orgId: string;
  skillsFeature: SkillsFeature;
}

/**
 * Create the updateSkill action
 */
export function createUpdateSkillAction(context: UpdateSkillActionContext): Tool {
  return tool({
    description: `Update an existing user skill.

You can update the key, name, description, and/or files.
System skills cannot be modified - only user-created skills can be updated.`,

    inputSchema: updateSkillSchema,

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
