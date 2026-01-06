import type { EventStreamManager } from '../../event-stream-manager';
import type { PubSubManager } from '../../../real-time';

/**
 * Context provided to client-side tools.
 *
 * Client tools use this context to:
 * - Publish events to the client via eventStreamManager
 * - Subscribe to responses via pubsub (for stateful tools)
 */
export interface ClientToolContext {
  /** Current session ID */
  sessionId: string;
  /** Current message ID being processed */
  messageId: string;
  /** Event stream manager for publishing events */
  eventStreamManager: EventStreamManager;
  /** Pub/Sub manager for subscribing to responses (required for stateful tools only) */
  pubsub?: PubSubManager;
}
