import { scheduledJobs, type ScheduledJob } from '../../../db/schema';
import type { ScheduledJobsCommandContextManager } from '../context';

export interface CreateScheduledJobInput {
  userId: string;
  orgId: string;
  name: string;
  description?: string;
  cronExpression: string;
  timezone: string;
  agentId: string;
  message: string;
  timeout?: number;
  enabled?: boolean;
  nextRunAt?: Date;
}

export type CreateScheduledJobResult = ScheduledJob;

/**
 * Create a new scheduled job.
 */
export class CreateScheduledJobCommand {
  constructor(
    private readonly contextManager: ScheduledJobsCommandContextManager
  ) {}

  execute = async (
    input: CreateScheduledJobInput
  ): Promise<CreateScheduledJobResult> => {
    return this.contextManager.handleCommand(async (ctx) => {
      const { tx } = ctx;

      const [job] = await tx
        .insert(scheduledJobs)
        .values({
          userId: input.userId,
          orgId: input.orgId,
          name: input.name,
          description: input.description,
          cronExpression: input.cronExpression,
          timezone: input.timezone,
          agentId: input.agentId,
          message: input.message,
          timeout: input.timeout,
          enabled: input.enabled ?? true,
          nextRunAt: input.nextRunAt,
        })
        .returning();

      if (!job) {
        throw new Error('Failed to create scheduled job');
      }

      return job;
    });
  };
}
