import type { PubSubManager } from './pubsub';
import {
  getCacheInvalidationChannel,
  getUserCacheInvalidationChannel,
  type CacheInvalidationEvent,
} from './cache-invalidation-types';

/**
 * Service for publishing cache invalidation events via Redis Pub/Sub.
 * Used by feature classes to notify connected clients when data changes.
 */
export class CacheInvalidationService {
  constructor(private pubsub: PubSubManager) {}

  async publishProjectCreated(orgId: string, projectId: string): Promise<void> {
    await this.publish({
      type: 'projects',
      action: 'created',
      entityId: projectId,
      orgId,
      timestamp: new Date().toISOString(),
    });
  }

  async publishProjectUpdated(orgId: string, projectId: string): Promise<void> {
    await this.publish({
      type: 'projects',
      action: 'updated',
      entityId: projectId,
      orgId,
      timestamp: new Date().toISOString(),
    });
  }

  async publishProjectDeleted(orgId: string, projectId: string): Promise<void> {
    await this.publish({
      type: 'projects',
      action: 'deleted',
      entityId: projectId,
      orgId,
      timestamp: new Date().toISOString(),
    });
  }

  async publishTaskCreated(
    orgId: string,
    taskId: string,
    projectId: string
  ): Promise<void> {
    await this.publish({
      type: 'tasks',
      action: 'created',
      entityId: taskId,
      projectId,
      orgId,
      timestamp: new Date().toISOString(),
    });
  }

  async publishTaskUpdated(
    orgId: string,
    taskId: string,
    projectId: string
  ): Promise<void> {
    await this.publish({
      type: 'tasks',
      action: 'updated',
      entityId: taskId,
      projectId,
      orgId,
      timestamp: new Date().toISOString(),
    });
  }

  async publishTaskMoved(
    orgId: string,
    taskId: string,
    projectId: string
  ): Promise<void> {
    await this.publish({
      type: 'tasks',
      action: 'moved',
      entityId: taskId,
      projectId,
      orgId,
      timestamp: new Date().toISOString(),
    });
  }

  async publishTaskDeleted(
    orgId: string,
    taskId: string,
    projectId: string
  ): Promise<void> {
    await this.publish({
      type: 'tasks',
      action: 'deleted',
      entityId: taskId,
      projectId,
      orgId,
      timestamp: new Date().toISOString(),
    });
  }

  async publishSessionCreated(
    userId: string,
    sessionId: string
  ): Promise<void> {
    await this.publishToUser({
      type: 'sessions',
      action: 'created',
      entityId: sessionId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  async publishSessionUpdated(
    userId: string,
    sessionId: string
  ): Promise<void> {
    await this.publishToUser({
      type: 'sessions',
      action: 'updated',
      entityId: sessionId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  async publishSessionDeleted(
    userId: string,
    sessionId: string
  ): Promise<void> {
    await this.publishToUser({
      type: 'sessions',
      action: 'deleted',
      entityId: sessionId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  async publishSessionMessageAdded(
    userId: string,
    sessionId: string
  ): Promise<void> {
    await this.publishToUser({
      type: 'sessions',
      action: 'message_added',
      entityId: sessionId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  async publishSessionSummaryUpdated(
    userId: string,
    sessionId: string
  ): Promise<void> {
    await this.publishToUser({
      type: 'sessions',
      action: 'summary_updated',
      entityId: sessionId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  async publishStreamingStarted(
    userId: string,
    sessionId: string
  ): Promise<void> {
    await this.publishToUser({
      type: 'sessions',
      action: 'streaming_started',
      entityId: sessionId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  async publishStreamingStopped(
    userId: string,
    sessionId: string
  ): Promise<void> {
    await this.publishToUser({
      type: 'sessions',
      action: 'streaming_stopped',
      entityId: sessionId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Publish streaming state change event with explicit isStreaming flag
   * Used by StreamingStateManager for reliable streaming state updates
   */
  async publishStreamingStateChanged(
    userId: string,
    sessionId: string,
    isStreaming: boolean
  ): Promise<void> {
    await this.publishToUser({
      type: 'sessions',
      action: 'streaming_state_changed',
      entityId: sessionId,
      userId,
      timestamp: new Date().toISOString(),
      isStreaming,
    });
  }

  private async publish(event: CacheInvalidationEvent): Promise<void> {
    try {
      const channel = getCacheInvalidationChannel(event.orgId!);
      await this.pubsub.publish(channel, event);
    } catch (error) {
      // Log error but don't fail the main operation - cache invalidation is best-effort
      console.error('[CacheInvalidation] Failed to publish event:', error, {
        type: event.type,
        action: event.action,
        entityId: event.entityId,
      });
    }
  }

  private async publishToUser(event: CacheInvalidationEvent): Promise<void> {
    try {
      const channel = getUserCacheInvalidationChannel(event.userId!);
      await this.pubsub.publish(channel, event);
    } catch (error) {
      // Log error but don't fail the main operation - cache invalidation is best-effort
      console.error(
        '[CacheInvalidation] Failed to publish user event:',
        error,
        {
          type: event.type,
          action: event.action,
          entityId: event.entityId,
        }
      );
    }
  }
}
