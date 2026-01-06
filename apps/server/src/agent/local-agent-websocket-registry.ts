import type { WebSocket } from 'ws';

/**
 * Registry for tracking active WebSocket connections to local agents.
 * Used for forwarding messages from users to connected local agents.
 */
export class LocalAgentWebSocketRegistry {
  private connections: Map<string, WebSocket>;

  constructor() {
    this.connections = new Map();
  }

  /**
   * Register a WebSocket connection for an agent
   */
  register(agentId: string, ws: WebSocket): void {
    this.connections.set(agentId, ws);
  }

  /**
   * Unregister a WebSocket connection for an agent
   */
  unregister(agentId: string): void {
    this.connections.delete(agentId);
  }

  /**
   * Get the WebSocket connection for an agent
   */
  getConnection(agentId: string): WebSocket | undefined {
    return this.connections.get(agentId);
  }

  /**
   * Send a message to a local agent via WebSocket
   * Returns true if sent successfully, false if agent not connected
   */
  sendMessage(agentId: string, message: unknown): boolean {
    const ws = this.connections.get(agentId);

    if (!ws || ws.readyState !== ws.OPEN) {
      return false;
    }

    try {
      ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Failed to send message to agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Check if an agent is currently connected
   */
  isConnected(agentId: string): boolean {
    const ws = this.connections.get(agentId);
    return ws !== undefined && ws.readyState === ws.OPEN;
  }

  /**
   * Get count of active connections
   */
  getConnectionCount(): number {
    return this.connections.size;
  }
}
