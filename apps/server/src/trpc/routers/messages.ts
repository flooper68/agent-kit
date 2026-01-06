import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, sessionProcedure } from '../trpc';
import type { StreamEvent } from '../../agent';

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

      // Handle local agent messages via WebSocket
      if (agentInfo.isLocalAgent) {
        try {
          // Create user message + assistant placeholder using feature command
          const { userMessageId, assistantMessageId } =
            await ctx.agentsFeature.messageLifecycle.sendUserMessage({
              sessionId: input.sessionId,
              content: input.content,
            });

          // Publish user message created event for real-time update
          await ctx.eventStreamManager.publish(input.sessionId, {
            type: 'user_message_created',
            sessionId: input.sessionId,
            messageId: userMessageId,
            content: input.content,
          } as Omit<StreamEvent, 'id' | 'timestamp'>);

          // Publish cache invalidation for session list update
          await ctx.cacheInvalidation.publishSessionMessageAdded(
            ctx.auth.userId,
            input.sessionId
          );

          // Fetch session messages and events for local agent
          const sessionHistory =
            await ctx.agentsFeature.sessions.getMessagesAndEvents(
              input.sessionId
            );

          if (!sessionHistory) {
            throw new Error('Failed to fetch session history');
          }

          // Forward message with session history to local agent via WebSocket
          const sent = ctx.localAgentWSRegistry.sendMessage(agentInfo.agentId, {
            type: 'user_message',
            sessionId: input.sessionId,
            messageId: assistantMessageId, // Assistant message ID for event association
            userMessageId,
            content: input.content,
            userId: ctx.auth.userId,
            timestamp: new Date().toISOString(),
            messages: sessionHistory.messages,
            events: sessionHistory.events,
          });

          if (!sent) {
            // Rollback assistant message on failure
            await ctx.agentsFeature.messages.updateStatus({
              messageId: assistantMessageId,
              status: 'error',
            });
            throw new Error('Local agent is not connected');
          }

          // Register streaming state for reliable client state management
          await ctx.streamingStateManager.startStreaming(
            input.sessionId,
            ctx.auth.userId,
            agentInfo.agentId,
            true // local agent
          );

          return { sessionId: input.sessionId };
        } catch (error) {
          // Convert service errors to TRPCError
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          const code =
            message === 'Local agent is not connected'
              ? 'PRECONDITION_FAILED'
              : 'INTERNAL_SERVER_ERROR';
          throw new TRPCError({ code, message });
        }
      }

      // Register streaming state BEFORE enqueueing job
      // This ensures client gets streaming state immediately, not after worker picks up
      await ctx.streamingStateManager.startStreaming(
        input.sessionId,
        ctx.auth.userId,
        agentInfo.agentId,
        false // server agent
      );

      // Enqueue job for server agent processing - message creation happens in job handler
      await ctx.jobQueueManager.enqueue({
        sessionId: input.sessionId,
        agentId: agentInfo.agentId,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        content: input.content,
      });

      // Publish cache invalidation for session list update
      await ctx.cacheInvalidation.publishSessionMessageAdded(
        ctx.auth.userId,
        input.sessionId
      );

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
