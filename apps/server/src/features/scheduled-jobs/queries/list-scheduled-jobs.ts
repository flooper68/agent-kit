import { eq, desc, and, or, ilike, lt } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { scheduledJobs, type ScheduledJob } from '../../../db/schema';

export interface ListScheduledJobsInput {
  userId: string;
  orgId: string;
  limit: number;
  cursor?: string;
  enabled?: boolean;
  search?: string;
}

export interface ListScheduledJobsResult {
  items: ScheduledJob[];
  nextCursor: string | undefined;
}

/**
 * List scheduled jobs with pagination and filtering.
 */
export class ListScheduledJobsQuery {
  constructor(private db: typeof DbType) {}

  async execute(
    input: ListScheduledJobsInput
  ): Promise<ListScheduledJobsResult> {
    const { userId, orgId, limit, cursor, enabled, search } = input;

    // Build conditions
    const conditions = [
      eq(scheduledJobs.userId, userId),
      eq(scheduledJobs.orgId, orgId),
    ];

    // Filter by enabled status if provided
    if (enabled !== undefined) {
      conditions.push(eq(scheduledJobs.enabled, enabled));
    }

    // Search filter
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(scheduledJobs.name, searchPattern),
          ilike(scheduledJobs.description, searchPattern)
        )!
      );
    }

    // Cursor pagination
    if (cursor) {
      const cursorJob = await this.db
        .select({ createdAt: scheduledJobs.createdAt })
        .from(scheduledJobs)
        .where(eq(scheduledJobs.id, cursor))
        .limit(1);

      if (cursorJob[0]) {
        conditions.push(lt(scheduledJobs.createdAt, cursorJob[0].createdAt));
      }
    }

    // Query with limit + 1 to check for next page
    const result = await this.db
      .select()
      .from(scheduledJobs)
      .where(and(...conditions))
      .orderBy(desc(scheduledJobs.createdAt))
      .limit(limit + 1);

    // Check if there's a next page
    const hasNextPage = result.length > limit;
    const items = hasNextPage ? result.slice(0, limit) : result;
    const lastItem = items[items.length - 1];
    const nextCursor = hasNextPage && lastItem ? lastItem.id : undefined;

    return { items, nextCursor };
  }
}
