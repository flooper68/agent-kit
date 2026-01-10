import { eq, and } from 'drizzle-orm';
import { skills, type Skill } from '../../../db/schema';
import type { SkillsCommandContextManager } from '../context';

export interface DeleteSkillInput {
  id: string;
  userId: string;
  orgId: string;
}

export type DeleteSkillResult = Skill | undefined;

/**
 * Delete a user skill.
 * Only user-owned skills can be deleted (not system skills).
 */
export class DeleteSkillCommand {
  constructor(private readonly contextManager: SkillsCommandContextManager) {}

  execute = async (input: DeleteSkillInput): Promise<DeleteSkillResult> => {
    return this.contextManager.handleCommand(async (ctx) => {
      const { tx } = ctx;

      // Delete only user-owned skills (not system skills)
      const [deleted] = await tx
        .delete(skills)
        .where(
          and(
            eq(skills.id, input.id),
            eq(skills.isSystem, false),
            eq(skills.userId, input.userId),
            eq(skills.orgId, input.orgId)
          )
        )
        .returning();

      if (deleted) {
        await ctx.cacheInvalidation?.publishSkillDeleted(
          input.userId,
          deleted.id
        );
      }

      return deleted;
    });
  };
}
