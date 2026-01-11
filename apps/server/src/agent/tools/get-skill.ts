import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { SkillsFeature } from '../../features/skills';

export interface GetSkillContext {
  userId: string;
  orgId: string;
  skillsFeature: SkillsFeature;
  allowedSkillIds: string[];
}

export function createGetSkillTool(context: GetSkillContext): Tool {
  return tool({
    description:
      'Get detailed information about a specific skill by ID or key. Returns full skill content including all files. Use to read skill documentation before using it.',
    inputSchema: z
      .object({
        skillId: z
          .string()
          .uuid()
          .optional()
          .describe('The unique ID of the skill'),
        skillKey: z
          .string()
          .optional()
          .describe(
            'The key of the skill (e.g., "web-research", "project-management")'
          ),
      })
      .refine((data) => data.skillId || data.skillKey, {
        message: 'Either skillId or skillKey must be provided',
      }),
    execute: async ({
      skillId,
      skillKey,
    }: {
      skillId?: string;
      skillKey?: string;
    }) => {
      let skill;

      if (skillId) {
        skill = await context.skillsFeature.getById({
          userId: context.userId,
          orgId: context.orgId,
          id: skillId,
        });
      } else if (skillKey) {
        skill = await context.skillsFeature.getByKey({
          userId: context.userId,
          orgId: context.orgId,
          key: skillKey,
        });
      }

      if (!skill) {
        return {
          success: false,
          error: skillId
            ? `Skill with ID ${skillId} not found`
            : `Skill with key "${skillKey}" not found`,
        };
      }

      // Validate skill access
      if (!context.allowedSkillIds.includes(skill.id)) {
        // Get available skills for helpful error message
        const allSkills = await context.skillsFeature.getAll({
          userId: context.userId,
          orgId: context.orgId,
        });
        const allowedSkills = allSkills.filter((s) =>
          context.allowedSkillIds.includes(s.id)
        );
        const availableKeys = allowedSkills.map((s) => s.key).join(', ');
        return {
          success: false,
          error: `Skill "${skill.key}" is not available to this agent. Available skills: ${availableKeys || 'none'}`,
        };
      }

      return {
        success: true,
        skill: {
          id: skill.id,
          key: skill.key,
          name: skill.name,
          description: skill.description,
          isSystem: skill.isSystem,
          files: skill.files.map((f) => ({
            path: f.path,
            content: f.content,
          })),
          createdAt: skill.createdAt.toISOString(),
          updatedAt: skill.updatedAt.toISOString(),
        },
      };
    },
  });
}
