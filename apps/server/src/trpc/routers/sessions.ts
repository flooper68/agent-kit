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
      const session = await ctx.agentsFeature.sessions.create({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        agentId: input.agentId,
        title: input.title,
        isLocalAgent: input.isLocalAgent,
      });
      await ctx.cacheInvalidation.publishSessionCreated(
        ctx.auth.userId,
        session.id
      );
      return session;
    }),

  list: orgProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().uuid().optional(),
        filter: z.enum(['my_chats', 'all', 'sub_agents']).default('my_chats'),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.agentsFeature.sessions.listByUser(
        ctx.auth.userId,
        input.limit,
        input.filter,
        input.cursor
      );

      // Batch fetch all streaming session IDs for efficient lookup
      const streamingSessionIds =
        await ctx.agentsFeature.streaming.getActiveSessionIds();

      // Add isStreaming flag to each session
      const itemsWithStreaming = result.items.map((session) => ({
        ...session,
        isStreaming: streamingSessionIds.has(session.id),
      }));

      return {
        items: itemsWithStreaming,
        nextCursor: result.nextCursor,
        totalCount: result.totalCount,
      };
    }),

  get: sessionProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Session ownership already verified by sessionProcedure middleware

      // IMPORTANT: Get lastStreamId FIRST, before fetching messages
      // This ensures the subscription starts from a point <= what's in the DB
      // Any events written after this point will be in BOTH DB and subscription,
      // which the client handles via accumulator initialization
      const lastStreamId = await ctx.eventStreamManager.getLastId(
        input.sessionId
      );

      // Check if session currently has an active streaming state
      // This allows the client to restore streaming status on reload
      // Uses StreamingStateManager which works for both server and local agents
      const isStreaming = await ctx.streamingStateManager.isStreaming(
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

      await ctx.cacheInvalidation.publishSessionUpdated(
        ctx.auth.userId,
        input.sessionId
      );

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

      await ctx.cacheInvalidation.publishSessionDeleted(
        ctx.auth.userId,
        input.sessionId
      );

      return { success: true };
    }),

  /**
   * Check if a session is currently streaming
   * Used by clients for recovery when streaming state events may have been missed
   */
  isStreaming: sessionProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Session ownership already verified by sessionProcedure middleware
      return ctx.streamingStateManager.isStreaming(input.sessionId);
    }),

  /**
   * Get all child sessions spawned from a parent session
   */
  getChildren: sessionProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Session ownership already verified by sessionProcedure middleware
      return ctx.agentsFeature.sessions.getChildren(input.sessionId);
    }),

  /**
   * Get the lineage (path from root to current session)
   * Returns array ordered from root (depth 0) to current session
   */
  getLineage: sessionProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Session ownership already verified by sessionProcedure middleware
      // Pass userId to ensure all sessions in lineage belong to same user
      return ctx.agentsFeature.sessions.getLineage(
        input.sessionId,
        ctx.auth.userId
      );
    }),
});
