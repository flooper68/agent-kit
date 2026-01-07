import { eq, desc, lt, and, inArray } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions, localAgents } from '../../../db/schema';
import type { PaginatedRecentActivity, RecentActivityItem } from '../types';

export interface GetRecentActivityInput {
  orgId: string;
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

    // Build the where conditions - always filter by orgId
    const conditions = [eq(agentSessions.orgId, input.orgId)];
    if (input.userId) {
      conditions.push(eq(agentSessions.userId, input.userId));
    }
    if (cursorDate) {
      conditions.push(lt(agentSessions.updatedAt, cursorDate));
    }

    // Build and execute query
    const results = await this.db
      .select({
        sessionId: agentSessions.id,
        userId: agentSessions.userId,
        agentId: agentSessions.agentId,
        title: agentSessions.title,
        status: agentSessions.status,
        messageCount: agentSessions.messageCount,
        updatedAt: agentSessions.updatedAt,
        parentSessionId: agentSessions.parentSessionId,
        spawnDepth: agentSessions.spawnDepth,
      })
      .from(agentSessions)
      .where(and(...conditions))
      .orderBy(desc(agentSessions.updatedAt))
      .limit(limit + 1); // Fetch one extra to detect if there are more

    // Determine if there are more results
    let nextCursor: string | undefined;
    if (results.length > limit) {
      const nextItem = results.pop();
      nextCursor = nextItem?.sessionId;
    }

    // Find local agent names for agentIds not in the built-in agentNames map
    const unknownAgentIds = [
      ...new Set(
        results.map((r) => r.agentId).filter((id) => !this.agentNames.has(id))
      ),
    ];

    const localAgentNames = new Map<string, string>();
    if (unknownAgentIds.length > 0) {
      const localAgentResults = await this.db
        .select({
          key: localAgents.key,
          name: localAgents.name,
        })
        .from(localAgents)
        .where(inArray(localAgents.key, unknownAgentIds));

      for (const la of localAgentResults) {
        localAgentNames.set(la.key, la.name);
      }
    }

    const items: RecentActivityItem[] = results.map((row) => ({
      sessionId: row.sessionId,
      userId: row.userId,
      agentId: row.agentId,
      agentName:
        this.agentNames.get(row.agentId) ??
        localAgentNames.get(row.agentId) ??
        row.agentId,
      title: row.title,
      status: row.status,
      messageCount: row.messageCount,
      updatedAt: row.updatedAt,
      parentSessionId: row.parentSessionId,
      spawnDepth: row.spawnDepth,
    }));

    return { items, nextCursor };
  }
}
