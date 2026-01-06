import type { StreamEvent } from './types';
import { createLogger } from './logger';

const log = createLogger('EventBufferQueue');

// Maximum buffer size to prevent memory exhaustion during long disconnections
const MAX_BUFFER_SIZE = 10000;

export interface BufferedEvent {
  sessionId: string;
  messageId: string;
  event: StreamEvent;
  timestamp: number;
}

/**
 * Buffers events when the WebSocket connection is unavailable.
 * Events are stored in FIFO order and can be drained on reconnection.
 * Has a maximum size limit to prevent memory exhaustion.
 */
export class EventBufferQueue {
  private queue: BufferedEvent[] = [];
  private droppedCount = 0;

  /**
   * Add an event to the buffer queue.
   * If the buffer is full, oldest events are dropped to make room.
   */
  enqueue(sessionId: string, messageId: string, event: StreamEvent): void {
    // Enforce maximum buffer size to prevent memory exhaustion
    if (this.queue.length >= MAX_BUFFER_SIZE) {
      this.queue.shift(); // Drop oldest event
      this.droppedCount++;
      if (this.droppedCount === 1 || this.droppedCount % 100 === 0) {
        log.error('Event buffer full, dropping oldest events', {
          droppedTotal: this.droppedCount,
          bufferSize: MAX_BUFFER_SIZE,
        });
      }
    }

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
    } else if (this.queue.length === 5000) {
      log.warn('Event buffer approaching limit', {
        count: 5000,
        maxSize: MAX_BUFFER_SIZE,
      });
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
   * Get the number of events dropped due to buffer overflow.
   */
  get dropped(): number {
    return this.droppedCount;
  }

  /**
   * Drain the queue, returning all events in order.
   * After this call, the queue is empty and dropped count is reset.
   */
  drain(): BufferedEvent[] {
    const events = this.queue;
    this.queue = [];
    this.droppedCount = 0;
    return events;
  }

  /**
   * Clear all events (e.g., on shutdown).
   * Also resets the dropped count.
   */
  clear(): void {
    this.queue = [];
    this.droppedCount = 0;
  }
}
