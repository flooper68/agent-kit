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

      // Delegate to AgentSpawner.spawn() for unified message dispatching
      const result = await ctx.agentSpawner.spawn({
        sessionId: input.sessionId,
        agentId: agentInfo.agentId,
        message: input.content,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
      });

      if (!result.dispatched) {
        const code =
          result.error === 'Local agent is not connected'
            ? 'PRECONDITION_FAILED'
            : 'INTERNAL_SERVER_ERROR';
        throw new TRPCError({
          code,
          message: result.error ?? 'Failed to send message',
        });
      }

      return { sessionId: input.sessionId };
    }),

  subscribe: sessionProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        lastEventId: z.string().optional(),
        replayHistory: z.boolean().optional().default(false),
      })
    )
    .subscription(async function* ({ ctx, input }) {
      // Session ownership already verified by sessionProcedure middleware
      // Subscribe to session events from Redis Stream
      // If replayHistory is true, all historical events are yielded first
      const eventStream = ctx.eventStreamManager.subscribe(
        input.sessionId,
        input.lastEventId,
        input.replayHistory
      );

      for await (const event of eventStream) {
        yield event;
      }
    }),

  interrupt: sessionProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Session ownership already verified by sessionProcedure middleware
      // Check if this is a local agent session
      const agentInfo = await ctx.agentsFeature.sessions.getAgentInfo(
        input.sessionId
      );

      if (agentInfo?.isLocalAgent) {
        // Forward interrupt to local agent via WebSocket
        const sent = ctx.localAgentWSRegistry.sendMessage(agentInfo.agentId, {
          type: 'interrupt',
          sessionId: input.sessionId,
          timestamp: new Date().toISOString(),
        });

        return { success: sent };
      }

      // Request interrupt via job registry for server agents
      const success = await ctx.jobRegistryManager.requestInterrupt(
        input.sessionId
      );

      return { success };
    }),
});
