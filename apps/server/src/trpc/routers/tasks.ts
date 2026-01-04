import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, orgProcedure, adminProcedure } from '../trpc';
import {
  TaskStatusSchema,
  TaskPrioritySchema,
} from '../../features/tasks/schemas';

export const tasksRouter = router({
  // List tasks for a project with filters
  list: orgProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        status: TaskStatusSchema.optional(),
        priority: TaskPrioritySchema.optional(),
        hasArtifacts: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.tasksFeature.listByProject({
        projectId: input.projectId,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        status: input.status ? [input.status] : undefined,
        priority: input.priority ? [input.priority] : undefined,
        hasArtifacts: input.hasArtifacts,
      });
    }),

  // Get tasks grouped by status (for Kanban view)
  getByStatus: orgProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.tasksFeature.getByStatus(
        input.projectId,
        ctx.auth.userId,
        ctx.auth.orgId
      );
    }),

  // Get single task with details
  get: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const task = await ctx.tasksFeature.getById(
        input.id,
        ctx.auth.userId,
        ctx.auth.orgId
      );
      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }
      return task;
    }),

  // Create task
  create: orgProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        title: z.string().min(1).max(255),
        description: z.string().max(5000).optional(),
        priority: TaskPrioritySchema.default('medium'),
        status: TaskStatusSchema.default('todo'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.tasksFeature.create({
        projectId: input.projectId,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: input.status,
      });
    }),

  // Update task
  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().max(5000).nullable().optional(),
        priority: TaskPrioritySchema.optional(),
        status: TaskStatusSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.tasksFeature.update({
        id: input.id,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: input.status,
      });
      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }
      return updated;
    }),

  // Move task (status change + position)
  move: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: TaskStatusSchema,
        position: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const moved = await ctx.tasksFeature.move({
        id: input.id,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        status: input.status,
        position: input.position,
      });
      if (!moved) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }
      return moved;
    }),

  // Delete task
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.tasksFeature.delete(
        input.id,
        ctx.auth.userId,
        ctx.auth.orgId
      );
      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }
      return { success: true };
    }),

  // Attach artifact to task
  attachArtifact: orgProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        artifactId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const attached = await ctx.tasksFeature.attachArtifact(
        input.taskId,
        input.artifactId,
        ctx.auth.userId,
        ctx.auth.orgId
      );
      return { success: true, alreadyAttached: !attached };
    }),

  // Detach artifact from task
  detachArtifact: orgProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        artifactId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const detached = await ctx.tasksFeature.detachArtifact(
        input.taskId,
        input.artifactId,
        ctx.auth.userId,
        ctx.auth.orgId
      );
      return { success: true, wasAttached: detached };
    }),

  // Search tasks across all projects
  search: orgProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.tasksFeature.search({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        query: input.query,
        limit: input.limit,
      });
    }),

  // Get task stats (admin only)
  getStats: adminProcedure.query(async ({ ctx }) => {
    return ctx.tasksFeature.getStats(ctx.auth.orgId);
  }),
});
