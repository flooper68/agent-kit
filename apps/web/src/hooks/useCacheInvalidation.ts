import { trpc } from '../lib/trpc';

/**
 * Hook that subscribes to server-sent cache invalidation events.
 * When projects or tasks are modified (by agent tools or other clients),
 * this hook invalidates the relevant React Query caches to trigger a refetch.
 *
 * Should be mounted once in the app, typically in a layout component.
 */
export function useCacheInvalidation() {
  const utils = trpc.useUtils();

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
      console.error('[CacheInvalidation] Subscription error:', error);
    },
  });
}
