import type { StreamEvent } from './types';
import { createLogger } from './logger';

const log = createLogger('EventBufferQueue');

export interface BufferedEvent {
  sessionId: string;
  messageId: string;
  event: StreamEvent;
  timestamp: number;
}

/**
 * Buffers events when the WebSocket connection is unavailable.
 * Events are stored in FIFO order and can be drained on reconnection.
 */
export class EventBufferQueue {
  private queue: BufferedEvent[] = [];

  /**
   * Add an event to the buffer queue.
   */
  enqueue(sessionId: string, messageId: string, event: StreamEvent): void {
    this.queue.push({
      sessionId,
      messageId,
      event,
      timestamp: Date.now(),
    });

    // Log warnings at thresholds
    if (this.queue.length === 100) {
      log.warn('Event buffer growing large', { count: 100 });
    } else if (this.queue.length === 1000) {
      log.warn('Event buffer very large', { count: 1000 });
    }
  }

  /**
   * Get the number of buffered events.
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * Check if the buffer has events.
   */
  get hasEvents(): boolean {
    return this.queue.length > 0;
  }

  /**
   * Drain the queue, returning all events in order.
   * After this call, the queue is empty.
   */
  drain(): BufferedEvent[] {
    const events = this.queue;
    this.queue = [];
    return events;
  }

  /**
   * Clear all events (e.g., on shutdown).
   */
  clear(): void {
    this.queue = [];
  }
}
