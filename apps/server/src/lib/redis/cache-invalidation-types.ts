import { z } from 'zod';

export const CacheInvalidationEventSchema = z.object({
  type: z.enum(['projects', 'tasks']),
  action: z.enum(['created', 'updated', 'deleted', 'moved']),
  entityId: z.string(),
  projectId: z.string().optional(),
  orgId: z.string(),
  timestamp: z.string(),
});

export type CacheInvalidationEvent = z.infer<
  typeof CacheInvalidationEventSchema
>;

export function getCacheInvalidationChannel(orgId: string): string {
  return `cache-invalidation:${orgId}`;
}
