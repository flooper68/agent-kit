import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { scheduledJobs, type ScheduledJob } from '../../../db/schema';

export interface GetScheduledJobByIdInput {
  id: string;
  userId: string;
  orgId: string;
}

export type GetScheduledJobByIdResult = ScheduledJob | null;

/**
 * Get a scheduled job by ID.
 * Returns null if not found or user doesn't have permission.
 */
export class GetScheduledJobByIdQuery {
  constructor(private db: typeof DbType) {}

  async execute(
    input: GetScheduledJobByIdInput
  ): Promise<GetScheduledJobByIdResult> {
    const { id, userId, orgId } = input;

    const [job] = await this.db
      .select()
      .from(scheduledJobs)
      .where(
        and(
          eq(scheduledJobs.id, id),
          eq(scheduledJobs.userId, userId),
          eq(scheduledJobs.orgId, orgId)
        )
      )
      .limit(1);

    return job ?? null;
  }
}
