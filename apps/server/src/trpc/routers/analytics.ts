import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, adminProcedure } from '../trpc';
import { TimeRangeSchema, GranularitySchema } from '../../features/shared';

export const analyticsRouter = router({
  getOverview: adminProcedure
    .input(
      z.object({
        timeRange: TimeRangeSchema.default('month'),
        userId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.analyticsFeature.getOverviewStats({
        timeRange: input.timeRange,
        orgId: ctx.auth.orgId,
        userId: input.userId,
      });
    }),

  getUsageOverTime: adminProcedure
    .input(
      z.object({
        timeRange: TimeRangeSchema.default('month'),
        granularity: GranularitySchema.optional(),
        userId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.analyticsFeature.getUsageOverTime({
        timeRange: input.timeRange,
        orgId: ctx.auth.orgId,
        granularity: input.granularity,
        userId: input.userId,
      });
    }),

  getAgentDistribution: adminProcedure
    .input(
      z.object({
        timeRange: TimeRangeSchema.default('month'),
        userId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.analyticsFeature.getAgentDistribution({
        timeRange: input.timeRange,
        orgId: ctx.auth.orgId,
        userId: input.userId,
      });
    }),

  getProviderDistribution: adminProcedure
    .input(
      z.object({
        timeRange: TimeRangeSchema.default('month'),
        userId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.analyticsFeature.getProviderDistribution({
        timeRange: input.timeRange,
        orgId: ctx.auth.orgId,
        userId: input.userId,
      });
    }),

  getRecentActivity: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(25),
        userId: z.string().optional(),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.analyticsFeature.getRecentActivity({
        orgId: ctx.auth.orgId,
        limit: input.limit,
        userId: input.userId,
        cursor: input.cursor,
      });
    }),

  getUsersWithSessions: adminProcedure
    .input(
      z.object({
        timeRange: TimeRangeSchema.default('month'),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.analyticsFeature.getUsersWithSessions({
        orgId: ctx.auth.orgId,
        timeRange: input.timeRange,
      });
    }),

  getTokensPerUser: adminProcedure
    .input(
      z.object({
        timeRange: TimeRangeSchema.default('month'),
        userId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.analyticsFeature.getTokensPerUser({
        timeRange: input.timeRange,
        orgId: ctx.auth.orgId,
        userId: input.userId,
      });
    }),

  getSessionDetail: adminProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const data = await ctx.analyticsFeature.getSessionDetail({
        sessionId: input.sessionId,
        orgId: ctx.auth.orgId,
      });
      if (!data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }
      return data;
    }),

  getWebSearchCalls: adminProcedure
    .input(
      z.object({
        timeRange: TimeRangeSchema.default('month'),
        userId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.analyticsFeature.getWebSearchCalls({
        timeRange: input.timeRange,
        orgId: ctx.auth.orgId,
        userId: input.userId,
      });
    }),

  // Project & Task Analytics
  getProjectStats: adminProcedure.query(async ({ ctx }) => {
    return ctx.projectsFeature.getStats({ orgId: ctx.auth.orgId });
  }),

  getTaskStats: adminProcedure.query(async ({ ctx }) => {
    return ctx.tasksFeature.getStats({ orgId: ctx.auth.orgId });
  }),
});
