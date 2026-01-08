import { z } from 'zod';

export const CacheInvalidationEventSchema = z.object({
  type: z.enum(['projects', 'tasks', 'sessions', 'agents', 'artifacts']),
  action: z.enum([
    'created',
    'updated',
    'deleted',
    'moved',
    'message_added',
    'summary_updated',
    'streaming_started',
    'streaming_stopped',
    'streaming_state_changed',
  ]),
  entityId: z.string(),
  projectId: z.string().optional(),
  orgId: z.string().optional(),
  userId: z.string().optional(),
  timestamp: z.string(),
  // For streaming_state_changed events
  isStreaming: z.boolean().optional(),
  // For artifact events (to invalidate per-agent artifact queries)
  agentId: z.string().optional(),
});

export type CacheInvalidationEvent = z.infer<
  typeof CacheInvalidationEventSchema
>;

export function getCacheInvalidationChannel(orgId: string): string {
  return `cache-invalidation:${orgId}`;
}

export function getUserCacheInvalidationChannel(userId: string): string {
  return `cache-invalidation:user:${userId}`;
}
