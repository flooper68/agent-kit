import { eq, and } from 'drizzle-orm';
import { scheduledJobs, type ScheduledJob } from '../../../db/schema';
import type { ScheduledJobsCommandContextManager } from '../context';

export interface UpdateScheduledJobInput {
  id: string;
  userId: string;
  orgId: string;
  name?: string;
  description?: string;
  cronExpression?: string;
  timezone?: string;
  agentId?: string;
  message?: string;
  timeout?: number | null;
  enabled?: boolean;
  nextRunAt?: Date;
  lastRunAt?: Date;
  lastRunStatus?: 'success' | 'failed' | 'running';
  lastSessionId?: string;
}

export type UpdateScheduledJobResult = ScheduledJob | null;

/**
 * Update an existing scheduled job.
 * Returns null if the job doesn't exist or user doesn't have permission.
 */
export class UpdateScheduledJobCommand {
  constructor(
    private readonly contextManager: ScheduledJobsCommandContextManager
  ) {}

  execute = async (
    input: UpdateScheduledJobInput
  ): Promise<UpdateScheduledJobResult> => {
    return this.contextManager.handleCommand(async (ctx) => {
      const { tx } = ctx;

      // Build update object with only provided fields
      const updateData: Partial<typeof scheduledJobs.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.cronExpression !== undefined)
        updateData.cronExpression = input.cronExpression;
      if (input.timezone !== undefined) updateData.timezone = input.timezone;
      if (input.agentId !== undefined) updateData.agentId = input.agentId;
      if (input.message !== undefined) updateData.message = input.message;
      if (input.timeout !== undefined) updateData.timeout = input.timeout;
      if (input.enabled !== undefined) updateData.enabled = input.enabled;
      if (input.nextRunAt !== undefined) updateData.nextRunAt = input.nextRunAt;
      if (input.lastRunAt !== undefined) updateData.lastRunAt = input.lastRunAt;
      if (input.lastRunStatus !== undefined)
        updateData.lastRunStatus = input.lastRunStatus;
      if (input.lastSessionId !== undefined)
        updateData.lastSessionId = input.lastSessionId;

      const [updated] = await tx
        .update(scheduledJobs)
        .set(updateData)
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
