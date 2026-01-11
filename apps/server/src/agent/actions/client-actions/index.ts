/**
 * Client-side actions that execute in the user's browser.
 *
 * These actions publish events to the client via Redis Streams and WebSocket,
 * allowing the AI agent to interact with the user's browser.
 *
 * Two patterns are supported:
 * - **Fire-and-forget**: Execute immediately, no response needed (e.g., navigateTo)
 * - **Stateful**: Wait for client response with timeout (e.g., getCurrentUIState)
 *
 * @see /docs/architecture/client-tool-relaying.md for architecture details
 */

export { createNavigateToAction } from './navigate-to-action';
export { createGetCurrentUIStateAction } from './get-current-ui-state-action';
export type { ClientActionContext } from './types';
