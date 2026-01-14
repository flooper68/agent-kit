import type { db as DbType } from '../../../db';

/**
 * Transaction type - extracted from Drizzle's db.transaction() callback parameter.
 * In Drizzle, the transaction object has the same interface as the db instance.
 */
export type Transaction = Parameters<
  Parameters<(typeof DbType)['transaction']>[0]
>[0];

/**
 * Context passed to commands during execution within a transaction.
 * Contains the transaction instance for all DB operations.
 */
export interface ActivityCommandContext {
  /** The Drizzle transaction instance - use this for all DB operations */
  tx: Transaction;
}
