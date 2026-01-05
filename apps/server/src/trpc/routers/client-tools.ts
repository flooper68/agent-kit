import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, sessionProcedure } from '../trpc';

/** Maximum response payload size (100KB) */
const MAX_RESPONSE_SIZE = 100 * 1024;

/**
 * Get the Redis Pub/Sub channel for client tool responses.
 * Used by both the tRPC router (to publish) and tool implementations (to subscribe).
 */
export function getClientToolResponseChannel(
  sessionId: string,
  requestId: string
): string {
  return `client_tool_response:${sessionId}:${requestId}`;
}

/**
 * Router for client-side tool responses.
 *
 * Client tools that require responses (stateful tools like `getCurrentUIState`)
 * use this router to send their results back to the server.
 * The server-side tool subscribes to a Redis Pub/Sub channel and waits for
 * the response from this mutation.
 */
export const clientToolsRouter = router({
  /**
   * Respond to a client tool request.
   *
   * Called by the client after executing a stateful tool request.
   * Publishes the response to Redis Pub/Sub where the waiting tool receives it.
   */
  respond: sessionProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        requestId: z.string().uuid(),
        response: z
          .unknown()
          .refine(
            (val) => {
              try {
                JSON.stringify(val);
                return true;
              } catch {
                return false;
              }
            },
            {
              message:
                'Response must be JSON serializable (no circular references)',
            }
          )
          .refine((val) => JSON.stringify(val).length <= MAX_RESPONSE_SIZE, {
            message: `Response payload exceeds maximum size of ${MAX_RESPONSE_SIZE} bytes`,
          }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Session ownership already verified by sessionProcedure middleware
      const channel = getClientToolResponseChannel(
        input.sessionId,
        input.requestId
      );

      try {
        await ctx.pubsub.publish(channel, input.response);
        return { success: true as const };
      } catch (error) {
        ctx.req.log.error(
          {
            err: error,
            sessionId: input.sessionId,
            requestId: input.requestId,
          },
          'Failed to publish client tool response'
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send response',
        });
      }
    }),
});
