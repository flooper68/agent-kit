import { eq, desc, lt, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';
import type { PaginatedRecentActivity, RecentActivityItem } from '../types';

export interface GetRecentActivityInput {
  limit?: number;
  userId?: string;
  cursor?: string;
}

export class GetRecentActivityQuery {
  private db: typeof DbType;
  private agentNames: Map<string, string>;

  constructor(db: typeof DbType, agentNames: Map<string, string>) {
    this.db = db;
    this.agentNames = agentNames;
  }

  async execute(
    input: GetRecentActivityInput
  ): Promise<PaginatedRecentActivity> {
    const limit = input.limit ?? 25;

    // If cursor is provided, get the cursor session's updatedAt for filtering
    let cursorDate: Date | undefined;
    if (input.cursor) {
      const cursorSession = await this.db
        .select({ updatedAt: agentSessions.updatedAt })
        .from(agentSessions)
        .where(eq(agentSessions.id, input.cursor))
        .limit(1);

      cursorDate = cursorSession[0]?.updatedAt;
    }

    // Build the where conditions
    const conditions = [];
    if (input.userId) {
      conditions.push(eq(agentSessions.userId, input.userId));
    }
    if (cursorDate) {
      conditions.push(lt(agentSessions.updatedAt, cursorDate));
    }

    // Build and execute query
    const query = this.db
      .select({
        sessionId: agentSessions.id,
        userId: agentSessions.userId,
        agentId: agentSessions.agentId,
        title: agentSessions.title,
        status: agentSessions.status,
        messageCount: agentSessions.messageCount,
        updatedAt: agentSessions.updatedAt,
      })
      .from(agentSessions)
      .orderBy(desc(agentSessions.updatedAt))
      .limit(limit + 1); // Fetch one extra to detect if there are more

    const results =
      conditions.length > 0
        ? await query.where(and(...conditions))
        : await query;

    // Determine if there are more results
    let nextCursor: string | undefined;
    if (results.length > limit) {
      const nextItem = results.pop();
      nextCursor = nextItem?.sessionId;
    }

    const items: RecentActivityItem[] = results.map((row) => ({
      sessionId: row.sessionId,
      userId: row.userId,
      agentId: row.agentId,
      agentName: this.agentNames.get(row.agentId) ?? row.agentId,
      title: row.title,
      status: row.status,
      messageCount: row.messageCount,
      updatedAt: row.updatedAt,
    }));

    return { items, nextCursor };
  }
}
