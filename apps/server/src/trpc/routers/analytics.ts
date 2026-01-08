import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { ClerkClient } from '@clerk/backend';
import { router, adminProcedure } from '../trpc';

const TimeRangeSchema = z.enum(['today', 'week', 'month', 'all']);
const GranularitySchema = z.enum(['hour', 'day', 'week']);

type ClerkUserInfo = {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

async function enrichWithClerkUserInfo<T extends { userId: string }>(
  clerk: ClerkClient,
  data: T[]
): Promise<(T & ClerkUserInfo)[]> {
  const userIds = data.map((d) => d.userId);
  if (userIds.length === 0) return [];

  const clerkUsers = await clerk.users.getUserList({
    userId: userIds,
    limit: Math.max(userIds.length, 100),
  });

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
}

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
      const users = await ctx.analyticsFeature.getUsersWithSessions({
        orgId: ctx.auth.orgId,
        timeRange: input.timeRange,
      });

      return enrichWithClerkUserInfo(ctx.clerk, users);
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
        orgId: ctx.auth.orgId,
        userId: input.userId,
      });

      return enrichWithClerkUserInfo(ctx.clerk, data);
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
      const data = await ctx.analyticsFeature.getWebSearchCalls({
        timeRange: input.timeRange,
        orgId: ctx.auth.orgId,
        userId: input.userId,
      });

      return enrichWithClerkUserInfo(ctx.clerk, data);
    }),

  // Project & Task Analytics
  getProjectStats: adminProcedure.query(async ({ ctx }) => {
    return ctx.projectsFeature.getStats({ orgId: ctx.auth.orgId });
  }),

  getTaskStats: adminProcedure.query(async ({ ctx }) => {
    return ctx.tasksFeature.getStats({ orgId: ctx.auth.orgId });
  }),
});
