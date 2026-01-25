import { eq, and } from 'drizzle-orm';
import { scheduledJobs, type ScheduledJob } from '../../../db/schema';
import type { ScheduledJobsCommandContextManager } from '../context';

export interface DeleteScheduledJobInput {
  id: string;
  userId: string;
  orgId: string;
}

export type DeleteScheduledJobResult = ScheduledJob | null;

/**
 * Delete a scheduled job.
 * Returns the deleted job or null if not found/no permission.
 */
export class DeleteScheduledJobCommand {
  constructor(
    private readonly contextManager: ScheduledJobsCommandContextManager
  ) {}

  execute = async (
    input: DeleteScheduledJobInput
  ): Promise<DeleteScheduledJobResult> => {
    return this.contextManager.handleCommand(async (ctx) => {
      const { tx } = ctx;

      const [deleted] = await tx
        .delete(scheduledJobs)
        .where(
          and(
            eq(scheduledJobs.id, input.id),
            eq(scheduledJobs.userId, input.userId),
            eq(scheduledJobs.orgId, input.orgId)
          )
        )
        .returning();

      return deleted ?? null;
    });
  };
}
