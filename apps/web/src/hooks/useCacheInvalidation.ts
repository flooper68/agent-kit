import { useState } from 'react';
import { trpc } from '../lib/trpc';

/**
 * Hook that subscribes to server-sent cache invalidation events.
 * When projects, tasks, sessions, agents, or artifacts are modified
 * (by agent tools or other clients), this hook invalidates the relevant
 * React Query caches to trigger a refetch.
 *
 * Should be mounted once in the app, typically in a layout component.
 */
export function useCacheInvalidation() {
  const utils = trpc.useUtils();

  // Org-scoped subscription for projects and tasks
  trpc.cache.subscribe.useSubscription(undefined, {
    onData: (event) => {
      switch (event.type) {
        case 'projects':
          // Invalidate project list queries
          utils.projects.list.invalidate();
          utils.projects.search.invalidate();

          // Invalidate specific project if we have the ID
          if (event.entityId) {
            utils.projects.get.invalidate({ id: event.entityId });
          }
          break;

        case 'tasks':
          // Invalidate individual task if we have the ID
          if (event.entityId) {
            utils.tasks.get.invalidate({ id: event.entityId });
          }

          if (event.projectId) {
            // Invalidate task queries for the affected project
            utils.tasks.list.invalidate({ projectId: event.projectId });
            utils.tasks.getByStatus.invalidate({ projectId: event.projectId });
            // Also invalidate project (task counts may have changed)
            utils.projects.get.invalidate({ id: event.projectId });
            utils.projects.list.invalidate();
          }
          // Invalidate org-level task stats
          utils.tasks.getStats.invalidate();
          // Invalidate search since it's cross-project
          utils.tasks.search.invalidate();
          break;
      }
    },
    onError: (error) => {
      console.error('[CacheInvalidation] Org subscription error:', error);
    },
  });

  // User-scoped subscription for sessions, agents, and artifacts
  trpc.cache.subscribeUser.useSubscription(undefined, {
    onData: (event) => {
      switch (event.type) {
        case 'sessions':
          // Handle streaming status changes - just invalidate the session list
          // to update streaming indicators in real-time
          if (
            event.action === 'streaming_started' ||
            event.action === 'streaming_stopped'
          ) {
            utils.sessions.list.invalidate();
            return;
          }

          // Handle streaming state changed events (new reliable streaming state)
          // This is the authoritative source for streaming status
          if (event.action === 'streaming_state_changed') {
            utils.sessions.list.invalidate();
            // Also invalidate the specific session's isStreaming query if it exists
            if (event.entityId) {
              utils.sessions.isStreaming.invalidate({
                sessionId: event.entityId,
              });
              // Invalidate session data to refresh usage stats after streaming completes
              utils.sessions.get.invalidate({ sessionId: event.entityId });
            }
            return;
          }

          // Invalidate session list (for updated timestamps or titles)
          utils.sessions.list.invalidate();

          // Invalidate specific session if we have the ID
          if (event.entityId) {
            utils.sessions.get.invalidate({ sessionId: event.entityId });
            utils.sessions.getResources.invalidate({
              sessionId: event.entityId,
            });
          }
          break;

        case 'agents':
          // Invalidate all agent list queries
          utils.agents.list.invalidate();
          utils.agents.listServer.invalidate();
          utils.agents.listExternal.invalidate();
          utils.agents.listCustom.invalidate();
          // Invalidate specific agent if we have the ID
          if (event.entityId) {
            utils.agents.getCustom.invalidate({ id: event.entityId });
          }
          break;

        case 'artifacts':
          // Invalidate artifact list queries
          utils.artifacts.list.invalidate();
          // Invalidate specific artifact if we have the ID
          if (event.entityId) {
            utils.artifacts.get.invalidate({ id: event.entityId });
          }
          // Invalidate artifact analytics queries
          utils.artifacts.getStats.invalidate();
          utils.artifacts.getOverTime.invalidate();
          utils.artifacts.getByAgent.invalidate();
          break;

        case 'skills':
          // Invalidate skill list queries
          utils.skills.list.invalidate();
          // Invalidate specific skill if we have the ID
          if (event.entityId) {
            utils.skills.get.invalidate({ id: event.entityId });
          }
          break;
      }
    },
    onError: (error) => {
      console.error('[CacheInvalidation] User subscription error:', error);
    },
  });
}

/**
 * Track external agent connection status for disabling disconnected agents.
 * Returns a Map of agentId -> isConnected.
 */
export function useExternalAgentConnectionStatus(hasExternalAgents: boolean) {
  const [connectionStatus, setConnectionStatus] = useState<
    Map<string, boolean>
  >(new Map());

  trpc.agents.externalConnectionStatus.useSubscription(undefined, {
    enabled: hasExternalAgents,
    onData: (update: { agentId: string; status: string }) => {
      setConnectionStatus((prev) => {
        const next = new Map(prev);
        next.set(update.agentId, update.status === 'connected');
        return next;
      });
    },
  });

  return connectionStatus;
}
