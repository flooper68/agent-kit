import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, orgProcedure, sessionProcedure } from '../trpc';

export const sessionsRouter = router({
  create: orgProcedure
    .input(
      z.object({
        agentId: z.string(),
        title: z.string().optional(),
        isLocalAgent: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.isLocalAgent) {
        // Validate local agent exists and belongs to user
        const localAgent = await ctx.localAgentsFeature.getById(
          input.agentId,
          ctx.auth.userId
        );
        if (!localAgent) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Local agent not found',
          });
        }
        if (localAgent.disabled) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot create session with disabled agent',
          });
        }
      } else {
        // Validate built-in agent exists
        if (!ctx.agentsFeature.agents.has(input.agentId)) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Agent not found: ${input.agentId}`,
          });
        }
      }

      return ctx.agentsFeature.sessions.create({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        agentId: input.agentId,
        title: input.title,
        isLocalAgent: input.isLocalAgent,
      });
    }),

  list: orgProcedure
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

      // Check if session currently has an active streaming job
      // This allows the client to restore streaming status on reload
      const isStreaming = await ctx.sessionManager.hasActiveJob(
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
        isStreaming,
      };
    }),

  getResources: sessionProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Session ownership already verified by sessionProcedure middleware
      return ctx.agentsFeature.sessions.getResources(input.sessionId);
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
