import type { PubSubManager } from './pubsub';
import {
  getCacheInvalidationChannel,
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

  private async publish(event: CacheInvalidationEvent): Promise<void> {
    try {
      const channel = getCacheInvalidationChannel(event.orgId);
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
}
