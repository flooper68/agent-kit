import { eq, and, or, desc, asc } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { skills, type Skill } from '../../../db/schema';

export interface GetAllSkillsInput {
  userId: string;
  orgId: string | null;
}

export type GetAllSkillsResult = Skill[];

/**
 * Get all skills accessible to a user.
 * Returns all system skills + user's own skills.
 * Used by skill tools (grepSkills, readSkillFile).
 */
export class GetAllSkillsQuery {
  constructor(private db: typeof DbType) {}

  async execute(input: GetAllSkillsInput): Promise<GetAllSkillsResult> {
    const { userId, orgId } = input;

    // Build user skills filter - only if orgId is provided
    const userSkillsFilter =
      orgId !== null
        ? and(
            eq(skills.isSystem, false),
            eq(skills.userId, userId),
            eq(skills.orgId, orgId)
          )
        : and(eq(skills.isSystem, false), eq(skills.userId, userId));

    const result = await this.db
      .select()
      .from(skills)
      .where(or(eq(skills.isSystem, true), userSkillsFilter))
      .orderBy(asc(skills.isSystem), desc(skills.updatedAt));

    return result;
  }
}
