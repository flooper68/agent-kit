import { eq, and, or, ilike, desc } from 'drizzle-orm';
import { escapeLikePattern } from '../../../lib/db/escape-like';
import type { db as DbType } from '../../../db';
import { slashCommands } from '../../../db/schema';

export interface SearchSlashCommandsInput {
  userId: string;
  orgId: string;
  query: string;
  limit?: number;
}

export interface SearchSlashCommandItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  prompt: string;
}

export interface SearchSlashCommandsResult {
  items: SearchSlashCommandItem[];
}

export class SearchSlashCommandsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: SearchSlashCommandsInput
  ): Promise<SearchSlashCommandsResult> {
    const { userId, orgId, query, limit = 10 } = input;

    const searchPattern = `%${escapeLikePattern(query.trim())}%`;

    const results = await this.db
      .select({
        id: slashCommands.id,
        key: slashCommands.key,
        name: slashCommands.name,
        description: slashCommands.description,
        prompt: slashCommands.prompt,
      })
      .from(slashCommands)
      .where(
        and(
          eq(slashCommands.orgId, orgId),
          eq(slashCommands.userId, userId),
          or(
            ilike(slashCommands.key, searchPattern),
            ilike(slashCommands.name, searchPattern)
          )
        )
      )
      .orderBy(desc(slashCommands.updatedAt))
      .limit(limit);

    return { items: results };
  }
}
