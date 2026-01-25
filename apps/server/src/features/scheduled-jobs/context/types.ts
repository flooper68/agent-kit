import type { db as DbType } from '../../../db';
import type { CacheInvalidationService } from '../../../real-time';

/**
 * Transaction type - extracted from Drizzle's db.transaction() callback parameter.
 * In Drizzle, the transaction object has the same interface as the db instance.
 */
export type Transaction = Parameters<
  Parameters<(typeof DbType)['transaction']>[0]
>[0];

/**
 * Context passed to commands during execution within a transaction.
 * Contains the transaction instance for all DB operations and services.
 */
export interface ScheduledJobsCommandContext {
  /** The Drizzle transaction instance - use this for all DB operations */
  tx: Transaction;
  /** Cache invalidation service for publishing scheduled job events */
  cacheInvalidation?: CacheInvalidationService;
}
