import type { db as DbType } from '../../../db';
import type { CacheInvalidationService } from '../../../real-time';
import type { ScheduledJobsCommandContext } from './types';

/**
 * Manages command execution within database transactions.
 * Provides a consistent pattern for wrapping command logic in transactions.
 */
export class ScheduledJobsCommandContextManager {
  constructor(
    private readonly db: typeof DbType,
    private readonly getCacheInvalidation: () =>
      | CacheInvalidationService
      | undefined
  ) {}

  /**
   * Execute a command within a transaction.
   *
   * @param fn - The command logic to execute within the transaction
   * @returns The result from the command function
   */
  handleCommand = async <T>(
    fn: (ctx: ScheduledJobsCommandContext) => Promise<T>
  ): Promise<T> => {
    return this.db.transaction(async (tx) => {
      const ctx: ScheduledJobsCommandContext = {
        tx,
        cacheInvalidation: this.getCacheInvalidation(),
      };
      return fn(ctx);
    });
  };
}
