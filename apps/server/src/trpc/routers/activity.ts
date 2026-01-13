import { z } from 'zod';
import type { ClerkClient } from '@clerk/backend';
import { router, orgProcedure, adminProcedure } from '../trpc';

const TimeRangeSchema = z.enum(['today', 'week', 'month', 'all']);

type ClerkUserInfo = {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

async function enrichWithClerkUserInfo<T extends { userId: string }>(
  clerk: ClerkClient,
  data: T[]
): Promise<(T & ClerkUserInfo)[]> {
  const userIds = [...new Set(data.map((d) => d.userId))];
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

export const activityRouter = router({
  /**
   * Record a heartbeat to track user activity.
   * Called periodically by the frontend while the user has the app open.
   */
  heartbeat: orgProcedure.mutation(async ({ ctx }) => {
    return ctx.activityFeature.recordHeartbeat({
      userId: ctx.auth.userId,
      orgId: ctx.auth.orgId,
    });
  }),

  /**
   * Get paginated list of activity sessions for analytics.
   */
  getSessions: adminProcedure
    .input(
      z.object({
        timeRange: TimeRangeSchema.default('month'),
        userId: z.string().optional(),
        limit: z.number().min(1).max(100).default(25),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.activityFeature.getSessions({
        orgId: ctx.auth.orgId,
        timeRange: input.timeRange,
        userId: input.userId,
        limit: input.limit,
        cursor: input.cursor,
      });

      // Enrich items with user info from Clerk
      const enrichedItems = await enrichWithClerkUserInfo(
        ctx.clerk,
        result.items
      );

      return {
        items: enrichedItems,
        nextCursor: result.nextCursor,
      };
    }),

  /**
   * Get aggregated statistics for activity sessions.
   */
  getStats: adminProcedure
    .input(
      z.object({
        timeRange: TimeRangeSchema.default('month'),
        userId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.activityFeature.getStats({
        orgId: ctx.auth.orgId,
        timeRange: input.timeRange,
        userId: input.userId,
      });
    }),
});
