import {
  eq,
  desc,
  and,
  isNull,
  isNotNull,
  lt,
  count,
  type SQL,
} from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions, type AgentSession } from '../../../db/schema';

export type SessionFilter = 'my_chats' | 'all' | 'sub_agents';

export interface ListSessionsByUserInput {
  userId: string;
  limit: number;
  filter?: SessionFilter;
  cursor?: string;
}

export interface ListSessionsByUserResult {
  items: AgentSession[];
  nextCursor: string | undefined;
  totalCount: number;
}

export class ListSessionsByUserQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: ListSessionsByUserInput
  ): Promise<ListSessionsByUserResult> {
    const { userId, limit, filter = 'my_chats', cursor } = input;

    // Build conditions based on filter (for counting and querying)
    const baseConditions: SQL[] = [eq(agentSessions.userId, userId)];

    switch (filter) {
      case 'my_chats':
        // Root sessions only (no parent)
        baseConditions.push(isNull(agentSessions.parentSessionId));
        break;
      case 'sub_agents':
        // Only sessions with a parent (spawned sub-agents)
        baseConditions.push(isNotNull(agentSessions.parentSessionId));
        break;
      case 'all':
        // No additional filter - show all sessions
        break;
    }

    // Get total count (without cursor filter)
    const countResult = await this.db
      .select({ count: count() })
      .from(agentSessions)
      .where(and(...baseConditions));

    const totalCount = countResult[0]?.count ?? 0;

    // Build query conditions (including cursor if provided)
    const queryConditions = [...baseConditions];

    // Apply cursor-based pagination
    if (cursor) {
      // Get the cursor session's updatedAt timestamp
      const cursorSession = await this.db
        .select({ updatedAt: agentSessions.updatedAt })
        .from(agentSessions)
        .where(eq(agentSessions.id, cursor))
        .limit(1);

      const cursorDate = cursorSession[0]?.updatedAt;
      if (cursorDate) {
        queryConditions.push(lt(agentSessions.updatedAt, cursorDate));
      }
    }

    const items = await this.db
      .select()
      .from(agentSessions)
      .where(and(...queryConditions))
      .orderBy(desc(agentSessions.updatedAt))
      .limit(limit + 1);

    let nextCursor: string | undefined;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem?.id;
    }

    return { items, nextCursor, totalCount };
  }
}
