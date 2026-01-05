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
      // Get the agent info for the session (includes isLocalAgent flag)
      const agentInfo = await ctx.agentsFeature.sessions.getAgentInfo(
        input.sessionId
      );

      if (!agentInfo) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      if (!ctx.auth.orgId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization context required',
        });
      }

      // Check if this is a local agent session
      if (agentInfo.isLocalAgent) {
        // For now, just log the message - will be forwarded to external worker later
        console.log('[LocalAgent] Forwarding message:', {
          sessionId: input.sessionId,
          agentId: agentInfo.agentId,
          userId: ctx.auth.userId,
          orgId: ctx.auth.orgId,
          content: input.content,
        });

        // TODO: Implement actual forwarding to local agent worker
        return { sessionId: input.sessionId };
      }

      // Enqueue job for processing - message creation happens in job handler
      await ctx.sessionManager.sendMessage(
        input.sessionId,
        agentInfo.agentId,
        ctx.auth.userId,
        ctx.auth.orgId,
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
