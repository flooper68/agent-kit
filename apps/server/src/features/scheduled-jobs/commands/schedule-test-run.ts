import { eq, and } from 'drizzle-orm';
import { scheduledJobs, type ScheduledJob } from '../../../db/schema';
import type { ScheduledJobsCommandContextManager } from '../context';

export interface ScheduleTestRunInput {
  id: string;
  userId: string;
  orgId: string;
}

export type ScheduleTestRunResult = ScheduledJob | null;

/**
 * Schedule a job to run in 1 second for testing purposes.
 * The scheduler service will pick it up on the next poll cycle.
 * Returns null if the job doesn't exist or user doesn't have permission.
 */
export class ScheduleTestRunCommand {
  constructor(
    private readonly contextManager: ScheduledJobsCommandContextManager
  ) {}

  execute = async (
    input: ScheduleTestRunInput
  ): Promise<ScheduleTestRunResult> => {
    return this.contextManager.handleCommand(async (ctx) => {
      const { tx } = ctx;

      // Set nextRunAt to 1 second from now
      const nextRunAt = new Date(Date.now() + 1 * 1000);

      const [updated] = await tx
        .update(scheduledJobs)
        .set({
          nextRunAt,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(scheduledJobs.id, input.id),
            eq(scheduledJobs.userId, input.userId),
            eq(scheduledJobs.orgId, input.orgId)
          )
        )
        .returning();

      return updated ?? null;
    });
  };
}
