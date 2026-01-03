import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, orgProcedure, adminProcedure } from '../trpc';

const TimeRangeSchema = z.enum(['today', 'week', 'month', 'all']);

export const artifactsRouter = router({
  // List user's artifacts (paginated with optional search)
  list: orgProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(25),
        cursor: z.string().uuid().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.artifactsFeature.list({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        limit: input.limit,
        cursor: input.cursor,
        search: input.search,
      });
    }),

  // Get single artifact by ID
  get: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const artifact = await ctx.artifactsFeature.getById(
        input.id,
        ctx.auth.userId,
        ctx.auth.orgId
      );
      if (!artifact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Artifact not found',
        });
      }
      return artifact;
    }),

  // Delete artifact
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.artifactsFeature.delete(
        input.id,
        ctx.auth.userId,
        ctx.auth.orgId
      );
      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Artifact not found',
        });
      }
      return { success: true };
    }),

  // Analytics: Overview stats (admin only)
  getStats: adminProcedure
    .input(z.object({ timeRange: TimeRangeSchema.default('month') }))
    .query(async ({ ctx, input }) => {
      return ctx.artifactsFeature.getStats(ctx.auth.orgId, input.timeRange);
    }),

  // Analytics: Creation over time (admin only)
  getOverTime: adminProcedure
    .input(z.object({ timeRange: TimeRangeSchema.default('month') }))
    .query(async ({ ctx, input }) => {
      return ctx.artifactsFeature.getOverTime(ctx.auth.orgId, input.timeRange);
    }),

  // Analytics: By agent breakdown (admin only)
  getByAgent: adminProcedure
    .input(z.object({ timeRange: TimeRangeSchema.default('month') }))
    .query(async ({ ctx, input }) => {
      return ctx.artifactsFeature.getByAgent(ctx.auth.orgId, input.timeRange);
    }),
});
