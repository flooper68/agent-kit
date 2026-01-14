import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and } from 'drizzle-orm';
import { router, sessionProcedure } from '../trpc';
import { db } from '../../db';
import { agentSessionMessages } from '../../db/schema/agent-session-messages';
import { agentSessionEvents } from '../../db/schema/agent-session-events';
import type { StreamEvent } from '../../agent/event-stream-manager';
import { logger } from '../../agent/logger';

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
      const agentInfo = await ctx.agentsFeature.sessions.getAgentInfo(
        input.sessionId
      );

      return ctx.agentsFeature.sessions.interrupt({
        sessionId: input.sessionId,
        isLocalAgent: agentInfo?.isLocalAgent ?? false,
        agentId: agentInfo?.agentId ?? '',
      });
    }),

  resumeWithApproval: sessionProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        approvalId: z.string(), // AI SDK's approval ID
        approved: z.boolean(),
        denialReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { sessionId, approvalId, approved, denialReason } = input;

      // Find message awaiting approval for this session
      const pendingMessage = await db.query.agentSessionMessages.findFirst({
        where: and(
          eq(agentSessionMessages.sessionId, sessionId),
          eq(agentSessionMessages.status, 'awaiting_approval')
        ),
      });

      if (!pendingMessage) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No pending approval found for this session',
        });
      }

      const messageId = pendingMessage.id;

      // Get agent info for spawning
      const agentInfo =
        await ctx.agentsFeature.sessions.getAgentInfo(sessionId);
      if (!agentInfo) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      const approvedAt = new Date();

      // Publish approval response event to client (so UI can update)
      await ctx.eventStreamManager.publish(sessionId, {
        type: 'tool_approval_responded',
        sessionId,
        messageId,
        approvalId,
        approved,
        denialReason: approved ? undefined : denialReason,
        approvedByUserId: ctx.auth.userId,
        approvedAt: approvedAt.toISOString(),
      } as Omit<StreamEvent, 'id' | 'timestamp'>);

      // Persist the approval response to the original tool_approval_request event
      await db
        .update(agentSessionEvents)
        .set({
          approvalStatus: approved ? 'approved' : 'denied',
          approvalDenialReason: approved ? null : denialReason,
          approvedByUserId: ctx.auth.userId,
          approvedAt,
        })
        .where(
          and(
            eq(agentSessionEvents.sessionId, sessionId),
            eq(agentSessionEvents.approvalId, approvalId),
            eq(agentSessionEvents.type, 'tool_approval_request')
          )
        );

      // Spawn a new agent job with the approval response
      // The AI SDK will handle the tool execution via needsApproval flow
      const result = await ctx.agentSpawner.spawnWithApprovalResponse({
        sessionId,
        agentId: agentInfo.agentId,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId ?? '',
        approvalResponse: {
          approvalId,
          approved,
          reason: denialReason,
        },
      });

      if (!result.dispatched) {
        logger.error('Failed to spawn approval response job', {
          sessionId,
          error: result.error,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error ?? 'Failed to process approval response',
        });
      }

      return { success: true, action: approved ? 'approved' : 'denied' };
    }),
});
