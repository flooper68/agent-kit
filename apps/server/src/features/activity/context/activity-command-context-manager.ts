import type { db as DbType } from '../../../db';
import type { ActivityCommandContext } from './types';

/**
 * Manages command execution within database transactions.
 * Provides a consistent pattern for wrapping command logic in transactions.
 */
export class ActivityCommandContextManager {
  constructor(private readonly db: typeof DbType) {}

  /**
   * Execute a command within a transaction.
   *
   * @param fn - The command logic to execute within the transaction
   * @returns The result from the command function
   *
   * @example
   * ```typescript
   * const result = await this.contextManager.handleCommand(async (ctx) => {
   *   const { tx } = ctx;
   *   const [created] = await tx.insert(table).values(data).returning();
   *   return created;
   * });
   * ```
   */
  handleCommand = async <T>(
    fn: (ctx: ActivityCommandContext) => Promise<T>
  ): Promise<T> => {
    return this.db.transaction(async (tx) => {
      const ctx: ActivityCommandContext = { tx };
      return fn(ctx);
    });
  };
}
