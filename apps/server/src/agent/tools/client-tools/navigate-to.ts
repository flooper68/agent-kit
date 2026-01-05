import { tool } from 'ai';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import type { Tool } from '../../types';
import type { StreamEvent } from '../../agent-session-manager';
import type { ClientToolContext } from './types';

/**
 * Creates the navigateTo tool for navigating the user's browser.
 *
 * This is a **fire-and-forget** tool - it publishes the navigation request
 * and returns immediately without waiting for the client to confirm navigation.
 *
 * @example
 * Agent: "I'll take you to the projects page."
 * Tool call: navigateTo({ path: '/app/projects' })
 * Result: { success: true, message: 'Navigation to /app/projects initiated' }
 */
export function createNavigateToTool(context: ClientToolContext): Tool {
  return tool({
    description:
      "Navigate the user's browser to a specific route within the application. " +
      'Use this to direct users to relevant pages like projects, artifacts, or settings. ' +
      "The navigation happens immediately in the user's browser.",
    inputSchema: z.object({
      path: z
        .string()
        .min(1)
        .regex(/^\/(?![/\\])/, 'Path must start with a single forward slash')
        .refine(
          (path) => !path.includes('://') && !path.includes('//'),
          'Path cannot contain protocol or double slashes'
        )
        .describe(
          'Application route path (e.g., "/app/projects", "/app/artifacts", "/app/analytics")'
        ),
    }),
    execute: async ({ path }: { path: string }) => {
      const requestId = randomUUID();

      try {
        // Fire and forget - publish event and return immediately
        await context.sessionManager.publishEvent(context.sessionId, {
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
