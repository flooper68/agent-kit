import { eq, and, or } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { skills, type Skill } from '../../../db/schema';

export interface GetSkillByIdInput {
  id: string;
  userId: string;
  orgId: string;
}

export type GetSkillByIdResult = Skill | undefined;

/**
 * Get a skill by ID.
 * Returns the skill if it's a system skill OR owned by the user.
 */
export class GetSkillByIdQuery {
  constructor(private db: typeof DbType) {}

  async execute(input: GetSkillByIdInput): Promise<GetSkillByIdResult> {
    const { id, userId, orgId } = input;

    const result = await this.db
      .select()
      .from(skills)
      .where(
        and(
          eq(skills.id, id),
          or(
            eq(skills.isSystem, true),
            and(eq(skills.userId, userId), eq(skills.orgId, orgId))
          )
        )
      )
      .limit(1);

    return result[0];
  }
}
