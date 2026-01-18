import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { skills, type Skill } from '../../../db/schema';

export interface GetSkillByKeyInput {
  key: string;
  userId: string;
  orgId: string;
}

export type GetSkillByKeyResult = Skill | undefined;

/**
 * Get a skill by its unique key.
 * Returns the skill if it's a system skill OR owned by the user.
 * Prefers user's skill over system skill if keys match.
 */
export class GetSkillByKeyQuery {
  constructor(private db: typeof DbType) {}

  async execute(input: GetSkillByKeyInput): Promise<GetSkillByKeyResult> {
    const { key, userId, orgId } = input;
    const normalizedKey = key.toLowerCase();

    // First try to find user's skill with this key
    const userSkill = await this.db
      .select()
      .from(skills)
      .where(
        and(
          eq(skills.key, normalizedKey),
          eq(skills.isSystem, false),
          eq(skills.userId, userId),
          eq(skills.orgId, orgId)
        )
      )
      .limit(1);

    if (userSkill[0]) {
      return userSkill[0];
    }

    // Fall back to system skill
    const systemSkill = await this.db
      .select()
      .from(skills)
      .where(and(eq(skills.key, normalizedKey), eq(skills.isSystem, true)))
      .limit(1);

    return systemSkill[0];
  }
}
