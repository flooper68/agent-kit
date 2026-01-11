import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { SkillsFeature } from '../../features/skills';
import { listSkillsSchema } from '@agent-kit/shared';

export interface ListSkillsContext {
  userId: string;
  orgId: string;
  skillsFeature: SkillsFeature;
  allowedSkillIds: string[];
}

export function createListSkillsAction(context: ListSkillsContext): Tool {
  return tool({
    description:
      'List all skills available to the user. Returns skill names, descriptions, and metadata. Use to discover available skills before using them.',
    inputSchema: listSkillsSchema,
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
