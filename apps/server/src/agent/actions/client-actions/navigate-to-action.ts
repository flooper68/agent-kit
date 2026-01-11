import { tool } from 'ai';
import { randomUUID } from 'crypto';
import type { Tool } from '../../shared/types';
import type { StreamEvent } from '../../shared/event-stream-manager';
import type { ClientActionContext } from './types';
import { navigateToSchema } from '@agent-kit/shared';

/**
 * Creates the navigateTo action for navigating the user's browser.
 *
 * This is a **fire-and-forget** action - it publishes the navigation request
 * and returns immediately without waiting for the client to confirm navigation.
 *
 * @example
 * Agent: "I'll take you to the projects page."
 * Action call: navigateTo({ path: '/app/projects' })
 * Result: { success: true, message: 'Navigation to /app/projects initiated' }
 */
export function createNavigateToAction(context: ClientActionContext): Tool {
  return tool({
    description:
      "Navigate the user's browser to a specific route within the application. " +
      'Use this to direct users to relevant pages like projects, artifacts, or settings. ' +
      "The navigation happens immediately in the user's browser.",
    inputSchema: navigateToSchema,
    execute: async ({ path }: { path: string }) => {
      const requestId = randomUUID();

      try {
        // Fire and forget - publish event and return immediately
        await context.eventStreamManager.publish(context.sessionId, {
          type: 'client_tool_request',
          sessionId: context.sessionId,
          messageId: context.messageId,
          toolName: 'navigateTo',
          requestId,
          params: { path },
          requiresResponse: false,
        } as Omit<StreamEvent, 'id' | 'timestamp'>);

        return {
          success: true,
          path,
          message: `Navigation to ${path} initiated`,
        };
      } catch (error) {
        console.error('[navigateTo] Failed to publish event:', error);
        return {
          success: false,
          error: 'Failed to send navigation request to client',
        };
      }
    },
  });
}
