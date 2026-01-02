import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, sessionProcedure } from '../trpc';

export const messagesRouter = router({
  send: sessionProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        content: z.string().min(1).max(50000), // 50KB limit to prevent DoS
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Session ownership already verified by sessionProcedure middleware
      // Get the agentId for the session
      const agentId = await ctx.agentsFeature.sessions.getAgentId(
        input.sessionId
      );

      if (!agentId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      // Enqueue job for processing - message creation happens in job handler
      await ctx.sessionManager.sendMessage(
        input.sessionId,
        agentId,
        ctx.auth.userId,
        input.content
      );

      return { sessionId: input.sessionId };
    }),

  subscribe: sessionProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        lastEventId: z.string().optional(),
      })
    )
    .subscription(async function* ({ ctx, input }) {
      // Session ownership already verified by sessionProcedure middleware
      // Subscribe to session events from Redis Stream
      const eventStream = ctx.sessionManager.subscribeToSession(
        input.sessionId,
        input.lastEventId
      );

      for await (const event of eventStream) {
        yield event;
      }
    }),

  interrupt: sessionProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Session ownership already verified by sessionProcedure middleware
      // Request interrupt via sessionManager
      const success = await ctx.sessionManager.requestInterrupt(
        input.sessionId
      );

      return { success };
    }),
});
