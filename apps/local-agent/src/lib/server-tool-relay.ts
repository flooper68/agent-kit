import type WebSocket from 'ws';
import type { ServerToolName } from '@agent-kit/shared';
import { createLogger } from './logger';

const log = createLogger('ServerToolRelay');

const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Tool-specific timeout overrides in milliseconds.
 * Tools not listed here use DEFAULT_TIMEOUT_MS.
 */
const TOOL_TIMEOUTS: Partial<Record<ServerToolName, number>> = {
  // Web operations may take longer
  webSearch: 60000, // 60 seconds
  fetch: 60000, // 60 seconds
};

/**
 * Get the timeout for a specific tool.
 */
function getToolTimeout(tool: ServerToolName): number {
  return TOOL_TIMEOUTS[tool] ?? DEFAULT_TIMEOUT_MS;
}

interface PendingRequest {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
  tool: string;
}

/**
 * Manages server tool request-response correlation.
 * Handles sending requests to the server via WebSocket and tracking pending responses.
 *
 * This is a generalized version of ArtifactToolRelay that supports all server tools:
 * - Static tools: webSearch, fetch
 * - Artifact tools: writeArtifact, readArtifact, searchArtifacts
 * - Project tools: listProjects, searchProjects, getProject, createProject, updateProject
 * - Task tools: listTasks, searchTasks, getTask, createTask, updateTask, moveTask, reorderTask,
 *               attachArtifactToTask, detachArtifactFromTask
 * - Client tools: navigateTo, getCurrentUIState
 */
export class ServerToolRelay {
  private pendingRequests = new Map<string, PendingRequest>();
  private ws: WebSocket | null = null;
  private isClearing = false;

  /**
   * Set the WebSocket connection for server tool operations.
   */
  setConnection(ws: WebSocket): void {
    this.ws = ws;
    log.debug('Connection set for server tool relay');
  }

  /**
   * Clear the connection and reject all pending requests.
   * Uses isClearing flag to prevent race conditions with concurrent executeServerTool calls.
   */
  clearConnection(): void {
    this.isClearing = true;
    // Reject all pending requests
    for (const [requestId, pending] of this.pendingRequests) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('Connection lost'));
      log.debug('Rejected pending request due to connection loss', {
        requestId: requestId.slice(0, 8) + '...',
        tool: pending.tool,
      });
    }
    this.pendingRequests.clear();
    this.ws = null;
    this.isClearing = false;
    log.debug('Connection cleared for server tool relay');
  }

  /**
   * Check if the relay is connected and ready to send requests.
   */
  isConnected(): boolean {
    return this.ws !== null;
  }

  /**
   * Execute a server tool on the server and wait for the response.
   *
   * @param tool - The server tool to execute
   * @param params - Parameters for the tool
   * @param sessionId - The session ID for this request
   * @param timeoutMs - Timeout in milliseconds (uses tool-specific default if not provided)
   * @returns The tool result from the server
   */
  async executeServerTool(
    tool: ServerToolName,
    params: Record<string, unknown>,
    sessionId: string,
    timeoutMs?: number
  ): Promise<unknown> {
    // Prevent new requests during connection clearing to avoid race conditions
    if (this.isClearing) {
      throw new Error('Connection is being cleared');
    }

    const timeout = timeoutMs ?? getToolTimeout(tool);
    const ws = this.ws;
    if (!ws) {
      throw new Error('Not connected to server');
    }

    const requestId = crypto.randomUUID();

    log.debug('Executing server tool', {
      requestId: requestId.slice(0, 8) + '...',
      sessionId: sessionId.slice(0, 8) + '...',
      tool,
      params: Object.keys(params),
    });

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        log.warn('Server tool request timed out', {
          requestId: requestId.slice(0, 8) + '...',
          tool,
          timeoutMs: timeout,
        });
        reject(new Error(`Server tool request timed out after ${timeout}ms`));
      }, timeout);

      this.pendingRequests.set(requestId, { resolve, reject, timeoutId, tool });

      const message = {
        type: 'server_tool_request',
        requestId,
        sessionId,
        tool,
        params,
        timestamp: new Date().toISOString(),
      };

      try {
        ws.send(JSON.stringify(message));
        log.debug('Sent server tool request', {
          requestId: requestId.slice(0, 8) + '...',
          tool,
        });
      } catch (error) {
        // Clean up on send failure
        clearTimeout(timeoutId);
        this.pendingRequests.delete(requestId);
        log.error('Failed to send server tool request', {
          requestId: requestId.slice(0, 8) + '...',
          error: error instanceof Error ? error.message : String(error),
        });
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Handle a response from the server for a pending server tool request.
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

    log.debug('Received server tool response', {
      requestId: requestId.slice(0, 8) + '...',
      tool: pending.tool,
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
