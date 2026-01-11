import { eq, and } from 'drizzle-orm';
import { skills, type Skill, type SkillFile } from '../../../db/schema';
import type { SkillsCommandContextManager } from '../context';

export interface UpdateSkillInput {
  id: string;
  userId: string;
  orgId: string;
  key?: string;
  name?: string;
  description?: string;
  files?: SkillFile[];
}

export type UpdateSkillResult = Skill | undefined;

/**
 * Update an existing user skill.
 * Only user-owned skills can be updated (not system skills).
 */
export class UpdateSkillCommand {
  constructor(private readonly contextManager: SkillsCommandContextManager) {}

  execute = async (input: UpdateSkillInput): Promise<UpdateSkillResult> => {
    return this.contextManager.handleCommand(async (ctx) => {
      const { tx } = ctx;

      // Build partial update object
      const updates: Partial<{
        key: string;
        name: string;
        description: string;
        files: SkillFile[];
        updatedAt: Date;
      }> = {
        updatedAt: new Date(),
      };

      if (input.key !== undefined) updates.key = input.key;
      if (input.name !== undefined) updates.name = input.name;
      if (input.description !== undefined)
        updates.description = input.description;
      if (input.files !== undefined) updates.files = input.files;

      // Only update if at least one field provided
      if (Object.keys(updates).length === 1) {
        // Only updatedAt, no actual changes
        return undefined;
      }

      // Update only user-owned skills (not system skills)
      const [updated] = await tx
        .update(skills)
        .set(updates)
        .where(
          and(
            eq(skills.id, input.id),
            eq(skills.isSystem, false),
            eq(skills.userId, input.userId),
            eq(skills.orgId, input.orgId)
          )
        )
        .returning();

      if (updated) {
        await ctx.cacheInvalidation?.publishSkillUpdated(
          input.userId,
          updated.id
        );
      }

      return updated;
    });
  };
}
