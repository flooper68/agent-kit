import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { SkillsFeature } from '../../features/skills';

export interface ListSkillsContext {
  userId: string;
  orgId: string;
  skillsFeature: SkillsFeature;
  allowedSkillIds: string[];
}

export function createListSkillsTool(context: ListSkillsContext): Tool {
  return tool({
    description:
      'List all skills available to the user. Returns skill names, descriptions, and metadata. Use to discover available skills before using them.',
    inputSchema: z.object({
      filter: z
        .enum(['all', 'system', 'user'])
        .default('all')
        .describe(
          'Filter by skill type: system (built-in), user (custom), or all'
        ),
      search: z
        .string()
        .optional()
        .describe('Search skills by name, description, or key'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(20)
        .describe('Maximum number of skills to return (1-50)'),
    }),
    execute: async ({
      filter,
      search,
      limit,
    }: {
      filter?: 'all' | 'system' | 'user';
      search?: string;
      limit?: number;
    }) => {
      const skillFilter = filter ?? 'all';
      const skillLimit = limit ?? 20;

      const result = await context.skillsFeature.list({
        userId: context.userId,
        orgId: context.orgId,
        filter: skillFilter,
        search,
        limit: skillLimit,
      });

      // Filter to only allowed skills for this agent
      const allowedSkills = result.items.filter((skill) =>
        context.allowedSkillIds.includes(skill.id)
      );

      return {
        skills: allowedSkills.map((skill) => ({
          id: skill.id,
          key: skill.key,
          name: skill.name,
          description: skill.description,
          isSystem: skill.isSystem,
          fileCount: skill.files.length,
          createdAt: skill.createdAt.toISOString(),
          updatedAt: skill.updatedAt.toISOString(),
        })),
        total: allowedSkills.length,
        hasMore: false, // Filtering may affect pagination, so we can't reliably report hasMore
      };
    },
  });
}
