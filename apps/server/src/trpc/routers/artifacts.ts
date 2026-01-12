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
        excludeProjectId: z.string().uuid().optional(),
        uncategorized: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.artifactsFeature.list({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        limit: input.limit,
        cursor: input.cursor,
        search: input.search,
        excludeProjectId: input.excludeProjectId,
        uncategorized: input.uncategorized,
      });
    }),

  // Get single artifact by ID
  get: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const artifact = await ctx.artifactsFeature.getById({
        id: input.id,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
      });
      if (!artifact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Artifact not found',
        });
      }
      return artifact;
    }),

  // Create artifact
  create: orgProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        content: z.string().min(1).max(1_000_000),
        summary: z.string().max(500).optional(),
        format: z.enum(['markdown']).default('markdown'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.artifactsFeature.create({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        title: input.title,
        content: input.content,
        summary: input.summary,
        format: input.format,
      });
    }),

  // Delete artifact
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.artifactsFeature.delete({
        id: input.id,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
      });
      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Artifact not found',
        });
      }
      return { success: true };
    }),

  // Update artifact
  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        content: z.string().min(1).max(1_000_000).optional(),
        summary: z.string().max(500).optional(),
        format: z.enum(['markdown']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.artifactsFeature.update({
        id: input.id,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        title: input.title,
        content: input.content,
        summary: input.summary,
        format: input.format,
      });
      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Artifact not found',
        });
      }
      return updated;
    }),

  // Analytics: Overview stats (admin only)
  getStats: adminProcedure
    .input(z.object({ timeRange: TimeRangeSchema.default('month') }))
    .query(async ({ ctx, input }) => {
      return ctx.artifactsFeature.getStats({
        orgId: ctx.auth.orgId,
        timeRange: input.timeRange,
      });
    }),

  // Analytics: Creation over time (admin only)
  getOverTime: adminProcedure
    .input(z.object({ timeRange: TimeRangeSchema.default('month') }))
    .query(async ({ ctx, input }) => {
      return ctx.artifactsFeature.getOverTime({
        orgId: ctx.auth.orgId,
        timeRange: input.timeRange,
      });
    }),

  // Analytics: By agent breakdown (admin only)
  getByAgent: adminProcedure
    .input(z.object({ timeRange: TimeRangeSchema.default('month') }))
    .query(async ({ ctx, input }) => {
      return ctx.artifactsFeature.getByAgent({
        orgId: ctx.auth.orgId,
        timeRange: input.timeRange,
      });
    }),
});
