export type BufferableEvent = {
  type: 'text_delta' | 'reasoning_delta';
  content: string;
};

export type BufferedResult = {
  event: BufferableEvent;
  sequence: number;
} | null;

/**
 * Buffers consecutive events of the same type to reduce database writes.
 * Events are accumulated until the type changes, then flushed as a single event.
 */
export class EventBuffer {
  private buffer: BufferableEvent | null = null;
  private startSequence: number = 0;

  /**
   * Add event to buffer. Returns the previous buffered event if type changed,
   * null if event was accumulated into existing buffer.
   */
  add(event: BufferableEvent, sequence: number): BufferedResult {
    if (!this.buffer) {
      this.buffer = { ...event };
      this.startSequence = sequence;
      return null;
    }

    if (this.buffer.type === event.type) {
      // Same type - accumulate content
      this.buffer.content += event.content;
      return null;
    }

    // Type changed - flush old buffer, start new one
    const toFlush = { event: this.buffer, sequence: this.startSequence };
    this.buffer = { ...event };
    this.startSequence = sequence;
    return toFlush;
  }

  /** Flush and return any buffered event */
  flush(): BufferedResult {
    if (!this.buffer) return null;
    const result = { event: this.buffer, sequence: this.startSequence };
    this.buffer = null;
    return result;
  }
}
