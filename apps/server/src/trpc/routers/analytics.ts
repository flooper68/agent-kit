import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, adminProcedure } from '../trpc';

const TimeRangeSchema = z.enum(['today', 'week', 'month', 'all']);
const GranularitySchema = z.enum(['hour', 'day', 'week']);

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
      const users = await ctx.analyticsFeature.getUsersWithSessions({
        timeRange: input.timeRange,
      });

      // Fetch user info from Clerk
      const userIds = users.map((u) => u.userId);
      if (userIds.length === 0) return [];

      const clerkUsers = await ctx.clerk.users.getUserList({
        userId: userIds,
        limit: 100,
      });

      // Create a map for quick lookup
      const userMap = new Map(
        clerkUsers.data.map((u) => [
          u.id,
          {
            email: u.emailAddresses[0]?.emailAddress ?? null,
            firstName: u.firstName,
            lastName: u.lastName,
          },
        ])
      );

      return users.map((u) => {
        const info = userMap.get(u.userId);
        return {
          ...u,
          email: info?.email ?? null,
          firstName: info?.firstName ?? null,
          lastName: info?.lastName ?? null,
        };
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
      const data = await ctx.analyticsFeature.getTokensPerUser({
        timeRange: input.timeRange,
        userId: input.userId,
      });

      // Fetch user info from Clerk
      const userIds = data.map((d) => d.userId);
      if (userIds.length === 0) return [];

      const clerkUsers = await ctx.clerk.users.getUserList({
        userId: userIds,
        limit: 100,
      });

      // Create a map for quick lookup
      const userMap = new Map(
        clerkUsers.data.map((u) => [
          u.id,
          {
            email: u.emailAddresses[0]?.emailAddress ?? null,
            firstName: u.firstName,
            lastName: u.lastName,
          },
        ])
      );

      return data.map((d) => {
        const info = userMap.get(d.userId);
        return {
          ...d,
          email: info?.email ?? null,
          firstName: info?.firstName ?? null,
          lastName: info?.lastName ?? null,
        };
      });
    }),

  getSessionDetail: adminProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const data = await ctx.analyticsFeature.getSessionDetail(input.sessionId);
      if (!data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }
      return data;
    }),
});
