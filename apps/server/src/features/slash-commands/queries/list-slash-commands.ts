import { eq, desc, lt, and, or, ilike, type SQL, sql } from 'drizzle-orm';
import { escapeLikePattern } from '../../../lib/db/escape-like';
import type { db as DbType } from '../../../db';
import { slashCommands } from '../../../db/schema';

export interface ListSlashCommandsInput {
  userId: string;
  orgId: string;
  limit: number;
  cursor?: string;
  search?: string;
}

export interface SlashCommandListItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  prompt: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListSlashCommandsResult {
  items: SlashCommandListItem[];
  nextCursor: string | undefined;
}

export class ListSlashCommandsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: ListSlashCommandsInput
  ): Promise<ListSlashCommandsResult> {
    const { userId, orgId, limit, cursor, search } = input;

    // If cursor is provided, get the cursor command's createdAt for filtering
    let cursorDate: Date | undefined;
    let cursorId: string | undefined;
    if (cursor) {
      const cursorCommand = await this.db
        .select({ createdAt: slashCommands.createdAt, id: slashCommands.id })
        .from(slashCommands)
        .where(eq(slashCommands.id, cursor))
        .limit(1);

      if (cursorCommand.length === 0) {
        return { items: [], nextCursor: undefined };
      }

      cursorDate = cursorCommand[0]?.createdAt;
      cursorId = cursorCommand[0]?.id;
    }

    // Build the where conditions
    const conditions: SQL[] = [
      eq(slashCommands.orgId, orgId),
      eq(slashCommands.userId, userId),
    ];

    // Use compound cursor for stable pagination (handles same-timestamp edge case)
    if (cursorDate && cursorId) {
      conditions.push(
        or(
          lt(slashCommands.createdAt, cursorDate),
          and(
            eq(slashCommands.createdAt, cursorDate),
            sql`${slashCommands.id} < ${cursorId}`
          )!
        )!
      );
    }

    // Add search filter if provided
    if (search?.trim()) {
      const searchPattern = `%${escapeLikePattern(search.trim())}%`;
      conditions.push(
        or(
          ilike(slashCommands.key, searchPattern),
          ilike(slashCommands.name, searchPattern),
          ilike(slashCommands.description, searchPattern)
        )!
      );
    }

    // Get commands with stable ordering (createdAt desc, id desc)
    const results = await this.db
      .select({
        id: slashCommands.id,
        key: slashCommands.key,
        name: slashCommands.name,
        description: slashCommands.description,
        prompt: slashCommands.prompt,
        createdAt: slashCommands.createdAt,
        updatedAt: slashCommands.updatedAt,
      })
      .from(slashCommands)
      .where(and(...conditions))
      .orderBy(desc(slashCommands.createdAt), desc(slashCommands.id))
      .limit(limit + 1);

    // Determine if there are more results
    let nextCursor: string | undefined;
    if (results.length > limit) {
      const nextItem = results.pop();
      nextCursor = nextItem?.id;
    }

    return { items: results, nextCursor };
  }
}
