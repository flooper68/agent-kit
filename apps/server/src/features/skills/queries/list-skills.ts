import { eq, desc, and, or, ilike, lt } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { skills, type Skill } from '../../../db/schema';

export type SkillFilter = 'all' | 'system' | 'user';

export interface ListSkillsInput {
  userId: string;
  orgId: string;
  limit: number;
  cursor?: string;
  filter?: SkillFilter;
  search?: string;
}

export interface ListSkillsResult {
  items: Skill[];
  nextCursor: string | undefined;
}

/**
 * List skills with pagination and filtering.
 * Returns system skills (shared) + user's own skills.
 */
export class ListSkillsQuery {
  constructor(private db: typeof DbType) {}

  async execute(input: ListSkillsInput): Promise<ListSkillsResult> {
    const { userId, orgId, limit, cursor, filter = 'all', search } = input;

    // Build base conditions
    const conditions = [];

    // Filter by ownership: system skills OR user's skills
    if (filter === 'system') {
      conditions.push(eq(skills.isSystem, true));
    } else if (filter === 'user') {
      conditions.push(
        and(
          eq(skills.isSystem, false),
          eq(skills.userId, userId),
          eq(skills.orgId, orgId)
        )
      );
    } else {
      // All: system OR user's own
      conditions.push(
        or(
          eq(skills.isSystem, true),
          and(
            eq(skills.isSystem, false),
            eq(skills.userId, userId),
            eq(skills.orgId, orgId)
          )
        )
      );
    }

    // Search filter
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(skills.name, searchPattern),
          ilike(skills.description, searchPattern),
          ilike(skills.key, searchPattern)
        )
      );
    }

    // Cursor pagination
    if (cursor) {
      const cursorSkill = await this.db
        .select({ createdAt: skills.createdAt })
        .from(skills)
        .where(eq(skills.id, cursor))
        .limit(1);

      if (cursorSkill[0]) {
        conditions.push(lt(skills.createdAt, cursorSkill[0].createdAt));
      }
    }

    // Query with limit + 1 to check for next page
    const result = await this.db
      .select()
      .from(skills)
      .where(and(...conditions))
      .orderBy(desc(skills.isSystem), desc(skills.createdAt))
      .limit(limit + 1);

    // Check if there's a next page
    const hasNextPage = result.length > limit;
    const items = hasNextPage ? result.slice(0, limit) : result;
    const lastItem = items[items.length - 1];
    const nextCursor = hasNextPage && lastItem ? lastItem.id : undefined;

    return { items, nextCursor };
  }
}
