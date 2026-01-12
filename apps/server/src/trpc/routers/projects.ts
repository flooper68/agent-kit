import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, orgProcedure, adminProcedure } from '../trpc';

export const projectsRouter = router({
  // List user's projects (paginated with optional search)
  list: orgProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(25),
        cursor: z.string().uuid().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.projectsFeature.list({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        limit: input.limit,
        cursor: input.cursor,
        search: input.search,
      });
    }),

  // Get single project by ID with tasks grouped by status
  get: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.projectsFeature.getById({
        id: input.id,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
      });
      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }
      return project;
    }),

  // Create project
  create: orgProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        summary: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.projectsFeature.create({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        title: input.title,
        summary: input.summary,
      });
    }),

  // Update project
  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        summary: z.string().max(1000).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.projectsFeature.update({
        id: input.id,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        title: input.title,
        summary: input.summary,
      });
      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }
      return updated;
    }),

  // Delete project
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.projectsFeature.delete({
        id: input.id,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
      });
      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }
      return { success: true };
    }),

  // List artifacts attached to a project (paginated with optional search)
  listArtifacts: orgProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(25),
        cursor: z.string().uuid().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.projectsFeature.listArtifacts({
        projectId: input.projectId,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        limit: input.limit,
        cursor: input.cursor,
        search: input.search,
      });
    }),

  // Attach an artifact to a project
  attachArtifact: orgProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        artifactId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.projectsFeature.attachArtifact({
        projectId: input.projectId,
        artifactId: input.artifactId,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
      });
    }),

  // Detach an artifact from a project
  detachArtifact: orgProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        artifactId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.projectsFeature.detachArtifact({
        projectId: input.projectId,
        artifactId: input.artifactId,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
      });
    }),

  // Search projects
  search: orgProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.projectsFeature.search({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        query: input.query,
        limit: input.limit,
      });
    }),

  // Get stats (admin only)
  getStats: adminProcedure.query(async ({ ctx }) => {
    return ctx.projectsFeature.getStats({ orgId: ctx.auth.orgId });
  }),
});
