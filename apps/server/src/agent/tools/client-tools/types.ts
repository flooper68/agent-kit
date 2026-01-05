import type { AgentSessionManager } from '../../agent-session-manager';
import type { PubSubManager } from '../../../lib/redis/pubsub';

/**
 * Context provided to client-side tools.
 *
 * Client tools use this context to:
 * - Publish events to the client via sessionManager
 * - Subscribe to responses via pubsub (for stateful tools)
 */
export interface ClientToolContext {
  /** Current session ID */
  sessionId: string;
  /** Current message ID being processed */
  messageId: string;
  /** Session manager for publishing events */
  sessionManager: AgentSessionManager;
  /** Pub/Sub manager for subscribing to responses (stateful tools only) */
  pubsub: PubSubManager;
}
