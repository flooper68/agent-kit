import { tool } from 'ai';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import type { Tool } from '../../types';
import type { StreamEvent } from '../../agent-session-manager';
import type { ClientToolContext } from './types';
import type { PubSubMessage } from '../../../lib/redis/types';
import { getClientToolResponseChannel } from '../../../trpc/routers/client-tools';

/** Timeout for waiting for client response (5 seconds) */
const UI_STATE_TIMEOUT_MS = 5000;

/**
 * Response schema for UI state.
 * Describes the current state of the user's browser/application.
 */
const UIStateResponseSchema = z.object({
  path: z.string().describe('Current route path'),
  title: z.string().describe('Document title'),
  params: z
    .record(z.string(), z.string())
    .optional()
    .describe('Route parameters'),
  breadcrumbs: z.array(z.string()).optional().describe('Navigation breadcrumbs'),
  activeSection: z.string().optional().describe('Active sidebar/tab section'),
});

type UIStateResponse = z.infer<typeof UIStateResponseSchema>;

/**
 * Creates the getCurrentUIState tool for querying the user's browser state.
 *
 * This is a **stateful** tool - it publishes a request and waits for the client
 * to respond via Redis Pub/Sub. Includes a timeout to prevent hanging.
 *
 * @example
 * Agent: "Let me check which page you're on."
 * Tool call: getCurrentUIState()
 * Result: { path: '/app/projects/123', title: 'My Project', params: { projectId: '123' } }
 */
export function createGetCurrentUIStateTool(context: ClientToolContext): Tool {
  return tool({
    description:
      'Get the current UI state of the user\'s browser, including the current path, ' +
      'page title, and route parameters. Use this to understand what the user is ' +
      'currently looking at in the application.',
    inputSchema: z.object({}),
    execute: async () => {
      const requestId = randomUUID();
      const responseChannel = getClientToolResponseChannel(
        context.sessionId,
        requestId
      );

      // Set up response listener
      let responseHandler: ((message: PubSubMessage) => void) | null = null;
      const responsePromise = new Promise<UIStateResponse>((resolve, reject) => {
        responseHandler = (message: PubSubMessage) => {
          // Validate the response
          const parseResult = UIStateResponseSchema.safeParse(message.data);
          if (parseResult.success) {
            resolve(parseResult.data);
          } else {
            reject(
              new Error(
                `Invalid UI state response: ${parseResult.error.message}`
              )
            );
          }
        };
      });

      // Set up timeout with cleanup capability
      let timeoutId: NodeJS.Timeout | null = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('TIMEOUT'));
        }, UI_STATE_TIMEOUT_MS);
      });

      try {
        // Subscribe to response channel FIRST
        await context.pubsub.subscribe(responseChannel, responseHandler!);

        // Small delay to ensure subscription is fully established in Redis
        // This mitigates a race condition where the client could respond
        // before the subscription is ready
        await new Promise((resolve) => setTimeout(resolve, 50));

        // NOW publish request event to client
        await context.sessionManager.publishEvent(context.sessionId, {
          type: 'client_tool_request',
          sessionId: context.sessionId,
          messageId: context.messageId,
          toolName: 'getCurrentUIState',
          requestId,
          params: {},
          requiresResponse: true,
        } as Omit<StreamEvent, 'id' | 'timestamp'>);

        // Wait for response or timeout
        const response = await Promise.race([responsePromise, timeoutPromise]);

        // Clear timeout on success
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        return response;
      } catch (error) {
        // Clear timeout on error
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (error instanceof Error && error.message === 'TIMEOUT') {
          return {
            error: 'Client did not respond in time',
            message:
              'Unable to get UI state - the client browser may be disconnected or unresponsive.',
          };
        }
        console.error('[getCurrentUIState] Error:', error);
        return {
          error: 'Failed to get UI state',
          message:
            error instanceof Error
              ? error.message
              : 'Unknown error occurred',
        };
      } finally {
        // Always clean up subscription
        if (responseHandler) {
          await context.pubsub.unsubscribe(responseChannel, responseHandler);
        }
      }
    },
  });
}
