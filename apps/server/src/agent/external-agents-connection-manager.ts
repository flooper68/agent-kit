import type Redis from 'ioredis';
import type { PubSubManager } from '../real-time';
import { logger } from './logger';

/**
 * Interface for listing agents (dependency injection)
 */
interface AgentLister {
  list(userId: string): Promise<Array<{ id: string; key: string }>>;
}

export interface ExternalAgentConnection {
  agentId: string;
  userId: string;
  connectionId: string;
  connectedAt: string;
  lastPingAt: string;
}

export interface ConnectionStatusUpdate {
  agentId: string;
  userId: string;
  status: 'connected' | 'disconnected';
  timestamp: string;
}

/**
 * Manages external agent connection state in Redis and publishes connection status events.
 */
export class ExternalAgentsConnectionManager {
  private redis: Redis;
  private pubsub: PubSubManager;
  private log = logger.child({ component: 'ExternalAgentsConnectionManager' });

  constructor(redis: Redis, pubsub: PubSubManager) {
    this.redis = redis;
    this.pubsub = pubsub;
  }

  /**
   * Get the Redis hash key for a user's connections
   */
  private getUserConnectionsKey(userId: string): string {
    return `external-agents:connected:${userId}`;
  }

  /**
   * Get the pub/sub channel for a user's connection status updates
   */
  private getStatusChannel(userId: string): string {
    return `external-agents:status:${userId}`;
  }

  /**
   * Register a new external agent connection
   */
  async registerConnection(
    userId: string,
    agentId: string,
    connectionId: string
  ): Promise<void> {
    const now = new Date().toISOString();
    const connection: ExternalAgentConnection = {
      agentId,
      userId,
      connectionId,
      connectedAt: now,
      lastPingAt: now,
    };

    // Store in Redis hash
    await this.redis.hset(
      this.getUserConnectionsKey(userId),
      agentId,
      JSON.stringify(connection)
    );

    // Publish connection event
    const update: ConnectionStatusUpdate = {
      agentId,
      userId,
      status: 'connected',
      timestamp: now,
    };

    await this.pubsub.publish(this.getStatusChannel(userId), update);
  }

  /**
   * Unregister an external agent connection
   */
  async unregisterConnection(userId: string, agentId: string): Promise<void> {
    // Remove from Redis hash
    await this.redis.hdel(this.getUserConnectionsKey(userId), agentId);

    // Publish disconnection event
    const update: ConnectionStatusUpdate = {
      agentId,
      userId,
      status: 'disconnected',
      timestamp: new Date().toISOString(),
    };

    await this.pubsub.publish(this.getStatusChannel(userId), update);
  }

  /**
   * Get connection status for a specific agent
   */
  async getConnectionStatus(
    userId: string,
    agentId: string
  ): Promise<ExternalAgentConnection | null> {
    const data = await this.redis.hget(
      this.getUserConnectionsKey(userId),
      agentId
    );

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as ExternalAgentConnection;
    } catch (error) {
      this.log.error('Failed to parse connection data', { agentId, error });
      return null;
    }
  }

  /**
   * Get all connections for a user
   */
  async getUserConnections(userId: string): Promise<ExternalAgentConnection[]> {
    const data = await this.redis.hgetall(this.getUserConnectionsKey(userId));

    const connections: ExternalAgentConnection[] = [];

    for (const [agentId, json] of Object.entries(data)) {
      try {
        connections.push(JSON.parse(json) as ExternalAgentConnection);
      } catch (error) {
        this.log.error('Failed to parse connection data', { agentId, error });
      }
    }

    return connections;
  }

  /**
   * Update the last ping timestamp for a connection
   */
  async updatePing(userId: string, agentId: string): Promise<void> {
    const connection = await this.getConnectionStatus(userId, agentId);

    if (!connection) {
      return;
    }

    connection.lastPingAt = new Date().toISOString();

    await this.redis.hset(
      this.getUserConnectionsKey(userId),
      agentId,
      JSON.stringify(connection)
    );
  }

  /**
   * Clean up all connection data (called on server startup)
   */
  async cleanupAllConnections(): Promise<void> {
    // Scan for all connection keys and delete them
    const pattern = 'external-agents:connected:*';
    const keys: string[] = [];

    let cursor = '0';
    do {
      const [nextCursor, foundKeys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');

    if (keys.length > 0) {
      await this.redis.del(...keys);
      this.log.info('Cleaned up stale connection keys', { count: keys.length });
    }
  }

  /**
   * Subscribe to connection status updates for all of a user's external agents.
   * Yields initial status for all agents, then streams updates from pubsub.
   * Uses agent.key (not UUID) as agentId for UI matching consistency.
   */
  async *subscribeToStatusUpdates(
    userId: string,
    agentLister: AgentLister
  ): AsyncGenerator<ConnectionStatusUpdate> {
    // Yield initial status for all user's agents (use key for UI matching)
    const agents = await agentLister.list(userId);
    for (const agent of agents) {
      const connection = await this.getConnectionStatus(userId, agent.key);
      yield {
        agentId: agent.key,
        userId,
        status: connection ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      };
    }

    // Stream updates from pubsub
    const channel = this.getStatusChannel(userId);
    for await (const update of this.pubsub.subscribeAsync<ConnectionStatusUpdate>(
      channel
    )) {
      if (update.userId === userId) {
        yield update;
      }
    }
  }
}
