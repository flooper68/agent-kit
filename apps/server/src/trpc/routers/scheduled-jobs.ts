import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { CronExpressionParser } from 'cron-parser';
import { router, orgProcedure } from '../trpc';

/**
 * Calculate the next run time for a cron expression in the given timezone
 */
function calculateNextRunAt(cronExpression: string, timezone: string): Date {
  const cron = CronExpressionParser.parse(cronExpression, {
    tz: timezone,
  });
  return cron.next().toDate();
}

const CronExpressionSchema = z
  .string()
  .min(9)
  .max(100)
  .refine(
    (value) => {
      try {
        CronExpressionParser.parse(value);
        return true;
      } catch {
        return false;
      }
    },
    {
      message: 'Invalid cron expression format',
    }
  );

export const scheduledJobsRouter = router({
  // List scheduled jobs (paginated with filter and search)
  list: orgProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(25),
        cursor: z.string().uuid().optional(),
        enabled: z.boolean().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.scheduledJobsFeature.list({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        limit: input.limit,
        cursor: input.cursor,
        enabled: input.enabled,
        search: input.search,
      });
    }),

  // Get single scheduled job by ID
  get: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.scheduledJobsFeature.getById({
        id: input.id,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
      });
      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Scheduled job not found',
        });
      }
      return job;
    }),

  // Create a new scheduled job
  create: orgProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().max(1000).optional(),
        cronExpression: CronExpressionSchema,
        timezone: z.string().min(1).max(100).default('UTC'),
        agentId: z.string().min(1),
        message: z.string().min(1).max(10000),
        timeout: z.number().min(1000).max(3600000).optional(), // 1s to 1h
        enabled: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const nextRunAt = input.enabled
        ? calculateNextRunAt(input.cronExpression, input.timezone)
        : null;

      return ctx.scheduledJobsFeature.create({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        name: input.name,
        description: input.description,
        cronExpression: input.cronExpression,
        timezone: input.timezone,
        agentId: input.agentId,
        message: input.message,
        timeout: input.timeout,
        enabled: input.enabled,
        nextRunAt,
      });
    }),

  // Update an existing scheduled job
  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().max(1000).optional(),
        cronExpression: CronExpressionSchema.optional(),
        timezone: z.string().min(1).max(100).optional(),
        agentId: z.string().min(1).optional(),
        message: z.string().min(1).max(10000).optional(),
        timeout: z.number().min(1000).max(3600000).nullable().optional(),
        enabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // If cron, timezone, or enabled status changes, we need to recalculate nextRunAt
      let nextRunAt: Date | null | undefined = undefined;

      if (
        input.cronExpression !== undefined ||
        input.timezone !== undefined ||
        input.enabled !== undefined
      ) {
        // Fetch current job to get existing values for fields not being updated
        const currentJob = await ctx.scheduledJobsFeature.getById({
          id: input.id,
          userId: ctx.auth.userId,
          orgId: ctx.auth.orgId,
        });

        if (!currentJob) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message:
              'Scheduled job not found or you do not have permission to update it',
          });
        }

        const cronExpression = input.cronExpression ?? currentJob.cronExpression;
        const timezone = input.timezone ?? currentJob.timezone;
        const enabled = input.enabled ?? currentJob.enabled;

        nextRunAt = enabled
          ? calculateNextRunAt(cronExpression, timezone)
          : null;
      }

      const updated = await ctx.scheduledJobsFeature.update({
        id: input.id,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        name: input.name,
        description: input.description,
        cronExpression: input.cronExpression,
        timezone: input.timezone,
        agentId: input.agentId,
        message: input.message,
        timeout: input.timeout,
        enabled: input.enabled,
        nextRunAt,
      });
      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message:
            'Scheduled job not found or you do not have permission to update it',
        });
      }
      return updated;
    }),

  // Delete a scheduled job
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.scheduledJobsFeature.delete({
        id: input.id,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
      });
      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message:
            'Scheduled job not found or you do not have permission to delete it',
        });
      }
      return { success: true };
    }),
});
