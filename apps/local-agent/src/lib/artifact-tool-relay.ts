import type WebSocket from 'ws';
import { createLogger } from './logger';
import type { ArtifactToolName } from './types';

const log = createLogger('ArtifactToolRelay');

const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

interface PendingRequest {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

/**
 * Manages artifact tool request-response correlation.
 * Handles sending requests to the server via WebSocket and tracking pending responses.
 */
export class ArtifactToolRelay {
  private pendingRequests = new Map<string, PendingRequest>();
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;

  /**
   * Set the WebSocket connection and session context for artifact operations.
   */
  setConnection(ws: WebSocket, sessionId: string): void {
    this.ws = ws;
    this.sessionId = sessionId;
    log.debug('Connection set for artifact relay', {
      sessionId: sessionId.slice(0, 8) + '...',
    });
  }

  /**
   * Clear the connection and reject all pending requests.
   */
  clearConnection(): void {
    // Reject all pending requests
    for (const [requestId, pending] of this.pendingRequests) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('Connection lost'));
      log.debug('Rejected pending request due to connection loss', {
        requestId: requestId.slice(0, 8) + '...',
      });
    }
    this.pendingRequests.clear();
    this.ws = null;
    this.sessionId = null;
    log.debug('Connection cleared for artifact relay');
  }

  /**
   * Check if the relay is connected and ready to send requests.
   */
  isConnected(): boolean {
    return this.ws !== null && this.sessionId !== null;
  }

  /**
   * Execute an artifact tool on the server and wait for the response.
   *
   * @param tool - The artifact tool to execute
   * @param params - Parameters for the tool
   * @param timeoutMs - Timeout in milliseconds (default: 30 seconds)
   * @returns The tool result from the server
   */
  async executeArtifactTool(
    tool: ArtifactToolName,
    params: Record<string, unknown>,
    timeoutMs = DEFAULT_TIMEOUT_MS
  ): Promise<unknown> {
    if (!this.ws || !this.sessionId) {
      throw new Error('Not connected to server');
    }

    const requestId = crypto.randomUUID();

    log.debug('Executing artifact tool', {
      requestId: requestId.slice(0, 8) + '...',
      tool,
      params: Object.keys(params),
    });

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        log.warn('Artifact tool request timed out', {
          requestId: requestId.slice(0, 8) + '...',
          tool,
          timeoutMs,
        });
        reject(
          new Error(`Artifact tool request timed out after ${timeoutMs}ms`)
        );
      }, timeoutMs);

      this.pendingRequests.set(requestId, { resolve, reject, timeoutId });

      const message = {
        type: 'artifact_tool_request',
        requestId,
        sessionId: this.sessionId,
        tool,
        params,
        timestamp: new Date().toISOString(),
      };

      try {
        this.ws!.send(JSON.stringify(message));
        log.debug('Sent artifact tool request', {
          requestId: requestId.slice(0, 8) + '...',
          tool,
        });
      } catch (error) {
        // Clean up on send failure
        clearTimeout(timeoutId);
        this.pendingRequests.delete(requestId);
        log.error('Failed to send artifact tool request', {
          requestId: requestId.slice(0, 8) + '...',
          error: error instanceof Error ? error.message : String(error),
        });
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Handle a response from the server for a pending artifact tool request.
   *
   * @param requestId - The request ID from the response
   * @param result - The result data
   * @param isError - Whether the result is an error
   */
  handleResponse(requestId: string, result: unknown, isError?: boolean): void {
    const pending = this.pendingRequests.get(requestId);
    if (!pending) {
      log.warn('Received response for unknown request', {
        requestId: requestId.slice(0, 8) + '...',
      });
      return;
    }

    clearTimeout(pending.timeoutId);
    this.pendingRequests.delete(requestId);

    log.debug('Received artifact tool response', {
      requestId: requestId.slice(0, 8) + '...',
      isError,
    });

    if (isError) {
      pending.reject(new Error(String(result)));
    } else {
      pending.resolve(result);
    }
  }

  /**
   * Get the number of pending requests (for testing/debugging).
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}
