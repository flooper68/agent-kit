import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, sessionProcedure } from '../trpc';

export const sessionsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        agentId: z.string(),
        title: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate agent exists
      if (!ctx.agentsFeature.agents.has(input.agentId)) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Agent not found: ${input.agentId}`,
        });
      }

      return ctx.agentsFeature.sessions.create({
        userId: ctx.auth.userId,
        agentId: input.agentId,
        title: input.title,
      });
    }),

  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.agentsFeature.sessions.listByUser(
        ctx.auth.userId,
        input.limit
      );
    }),

  get: sessionProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Session ownership already verified by sessionProcedure middleware

      // IMPORTANT: Get lastStreamId FIRST, before fetching messages
      // This ensures the subscription starts from a point <= what's in the DB
      // Any events written after this point will be in BOTH DB and subscription,
      // which the client handles via accumulator initialization
      const lastStreamId = await ctx.sessionManager.getLastStreamId(
        input.sessionId
      );

      const session = await ctx.agentsFeature.sessions.getWithMessages(
        input.sessionId
      );

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      return {
        ...session,
        lastStreamId,
      };
    }),

  updateTitle: sessionProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        title: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Session ownership already verified by sessionProcedure middleware
      const updated = await ctx.agentsFeature.sessions.updateTitle({
        sessionId: input.sessionId,
        title: input.title,
      });

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      return updated;
    }),

  delete: sessionProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Session ownership already verified by sessionProcedure middleware
      const deleted = await ctx.agentsFeature.sessions.delete(input.sessionId);

      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      return { success: true };
    }),
});
