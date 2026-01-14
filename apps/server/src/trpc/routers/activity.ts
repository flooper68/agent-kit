import { z } from 'zod';
import { router, orgProcedure, adminProcedure } from '../trpc';
import { TimeRangeSchema } from '../../features/shared';

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
      return ctx.activityFeature.getSessions({
        orgId: ctx.auth.orgId,
        timeRange: input.timeRange,
        userId: input.userId,
        limit: input.limit,
        cursor: input.cursor,
      });
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

  /**
   * Get sessions formatted for timeline visualization.
   */
  getSessionsTimeline: adminProcedure
    .input(
      z.object({
        timeRange: TimeRangeSchema.default('month'),
        userId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.activityFeature.getSessionsTimeline({
        orgId: ctx.auth.orgId,
        timeRange: input.timeRange,
        userId: input.userId,
      });
    }),
});
