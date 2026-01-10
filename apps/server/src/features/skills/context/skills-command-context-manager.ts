import type { db as DbType } from '../../../db';
import type { CacheInvalidationService } from '../../../real-time';
import type { SkillsCommandContext } from './types';

/**
 * Manages command execution within database transactions.
 * Provides a consistent pattern for wrapping command logic in transactions.
 */
export class SkillsCommandContextManager {
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
   *
   * @example
   * ```typescript
   * const result = await this.contextManager.handleCommand(async (ctx) => {
   *   const { tx, cacheInvalidation } = ctx;
   *   const [created] = await tx.insert(skills).values(data).returning();
   *   await cacheInvalidation?.publishSkillCreated(userId, created.id);
   *   return created;
   * });
   * ```
   */
  handleCommand = async <T>(
    fn: (ctx: SkillsCommandContext) => Promise<T>
  ): Promise<T> => {
    return this.db.transaction(async (tx) => {
      const ctx: SkillsCommandContext = {
        tx,
        cacheInvalidation: this.getCacheInvalidation(),
      };
      return fn(ctx);
    });
  };
}
