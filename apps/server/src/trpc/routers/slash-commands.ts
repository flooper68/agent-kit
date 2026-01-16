import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, orgProcedure } from '../trpc';
import { DuplicateKeyError } from '../../features/slash-commands';

export const slashCommandsRouter = router({
  // List user's slash commands (paginated with optional search)
  list: orgProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(25),
        cursor: z.string().uuid().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.slashCommandsFeature.list({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        limit: input.limit,
        cursor: input.cursor,
        search: input.search,
      });
    }),

  // Search slash commands for autocomplete (lightweight)
  search: orgProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.slashCommandsFeature.search({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        query: input.query,
        limit: input.limit,
      });
    }),

  // Get single slash command by ID
  get: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const command = await ctx.slashCommandsFeature.getById({
        id: input.id,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
      });
      if (!command) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Slash command not found',
        });
      }
      return command;
    }),

  // Create slash command
  create: orgProcedure
    .input(
      z.object({
        key: z
          .string()
          .min(1)
          .max(64)
          .regex(
            /^[a-z0-9-]+$/,
            'Key must be lowercase alphanumeric with hyphens'
          ),
        name: z.string().min(1).max(255),
        description: z.string().max(500).optional(),
        prompt: z.string().min(1).max(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.slashCommandsFeature.create({
          userId: ctx.auth.userId,
          orgId: ctx.auth.orgId,
          key: input.key,
          name: input.name,
          description: input.description,
          prompt: input.prompt,
        });
      } catch (error) {
        if (error instanceof DuplicateKeyError) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message,
          });
        }
        throw error;
      }
    }),

  // Update slash command
  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        key: z
          .string()
          .min(1)
          .max(64)
          .regex(/^[a-z0-9-]+$/)
          .optional(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().max(500).nullable().optional(),
        prompt: z.string().min(1).max(10000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.slashCommandsFeature.update({
        id: input.id,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        key: input.key,
        name: input.name,
        description: input.description,
        prompt: input.prompt,
      });
      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Slash command not found',
        });
      }
      return updated;
    }),

  // Delete slash command
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.slashCommandsFeature.delete({
        id: input.id,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
      });
      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Slash command not found',
        });
      }
      return { success: true };
    }),
});
