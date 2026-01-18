/**
 * updateSkill action
 *
 * Update an existing user skill.
 * System skills cannot be modified through this action.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { SkillsFeature } from '../../../features/skills';
import { logger } from '../../../logger/logger';
import { SkillFilePathSchema, normalizeSkillFiles } from '../../skills/types';

export const updateSkillMetadata: ActionMetadata = {
  id: 'updateSkill',
  requiredScopes: [AgentScope.SKILLS_WRITE],
  needsApproval: true,
};

const log = logger.child({ module: 'update-skill-action' });

/**
 * Context for update skill action
 */
export interface UpdateSkillContext {
  userId: string;
  orgId: string;
  skillsFeature: SkillsFeature;
}

/**
 * Schema for skill file input with path validation
 * Accepts either content or contentBase64 to avoid escaping issues
 */
const SkillFileSchema = z
  .object({
    path: SkillFilePathSchema.describe('File path within the skill'),
    content: z
      .string()
      .min(1)
      .max(500_000)
      .optional()
      .describe('File content (max 500KB)'),
    contentBase64: z
      .string()
      .optional()
      .describe(
        'File content as base64 encoded string (alternative to content)'
      ),
  })
  .refine((data) => data.content || data.contentBase64, {
    message: 'Either content or contentBase64 must be provided',
  })
  .refine((data) => !(data.content && data.contentBase64), {
    message: 'Cannot provide both content and contentBase64',
  });

/**
 * Create the updateSkill action
 */
export function createUpdateSkillTool(context: UpdateSkillContext): Tool {
  return tool({
    description: `Update an existing user skill.

You can update the key, name, description, and/or files.
System skills cannot be modified - only user-created skills can be updated.`,

    inputSchema: z
      .object({
        id: z
          .string()
          .uuid()
          .optional()
          .describe('The ID of the skill to update'),
        skillKey: z
          .string()
          .optional()
          .describe('The key of the skill to update (alternative to id)'),
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
        name: z
          .string()
          .min(1)
          .max(255)
          .optional()
          .describe('New display name'),
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
      })
      .refine((data) => data.id || data.skillKey, {
        message: 'Either id or skillKey must be provided',
      }),

    execute: async ({
      id,
      skillKey,
      key,
      name,
      description,
      files,
    }: {
      id?: string;
      skillKey?: string;
      key?: string;
      name?: string;
      description?: string;
      files?: Array<{ path: string; content?: string; contentBase64?: string }>;
    }) => {
      // Resolve skillKey to id if needed
      let resolvedId = id;
      if (!resolvedId && skillKey) {
        const skill = await context.skillsFeature.getByKey({
          key: skillKey,
          userId: context.userId,
          orgId: context.orgId,
        });
        if (!skill) {
          log.warn('Skill not found by key', { skillKey });
          return {
            success: false,
            error: `Skill with key "${skillKey}" not found`,
          };
        }
        resolvedId = skill.id;
      }

      log.info('Updating skill', {
        id: resolvedId,
        skillKey,
        hasKey: !!key,
        hasName: !!name,
        hasFiles: !!files,
      });

      // Normalize files (decode base64 if present)
      const normalizedFiles = files ? normalizeSkillFiles(files) : undefined;

      try {
        const skill = await context.skillsFeature.update({
          id: resolvedId!,
          userId: context.userId,
          orgId: context.orgId,
          key,
          name,
          description,
          files: normalizedFiles,
        });

        if (!skill) {
          log.warn('Skill not found or not updatable', { id: resolvedId });
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
        log.error('Error updating skill', { error, id: resolvedId });

        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        if (
          errorMessage.includes('unique') ||
          errorMessage.includes('duplicate')
        ) {
          return {
            success: false,
            error: key
              ? `A skill with key "${key}" already exists. Choose a different key.`
              : 'A skill with this key already exists. Choose a different key.',
          };
        }

        return {
          success: false,
          error: `Failed to update skill: ${errorMessage}`,
        };
      }
    },
  });
}
