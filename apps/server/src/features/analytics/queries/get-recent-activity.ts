import { eq, desc, lt, and, inArray } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions, externalAgents, serverAgents } from '../../../db/schema';

export interface GetRecentActivityInput {
  orgId: string;
  limit?: number;
  userId?: string;
  cursor?: string;
}

export interface RecentActivityItem {
  sessionId: string;
  userId: string;
  agentId: string;
  agentName: string;
  title: string | null;
  status: string;
  messageCount: number;
  updatedAt: Date;
  parentSessionId: string | null;
  spawnDepth: number;
}

export interface PaginatedRecentActivity {
  items: RecentActivityItem[];
  nextCursor: string | undefined;
}

export type GetRecentActivityResult = PaginatedRecentActivity;

export class GetRecentActivityQuery {
  private db: typeof DbType;
  private agentNames: Map<string, string>;

  constructor(db: typeof DbType, agentNames: Map<string, string>) {
    this.db = db;
    this.agentNames = agentNames;
  }

  async execute(
    input: GetRecentActivityInput
  ): Promise<GetRecentActivityResult> {
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
      // Look up agents by key from both tables
      const [externalResults, serverResults] = await Promise.all([
        this.db
          .select({
            key: externalAgents.key,
            name: externalAgents.name,
          })
          .from(externalAgents)
          .where(inArray(externalAgents.key, unknownAgentIds)),
        this.db
          .select({
            key: serverAgents.key,
            name: serverAgents.name,
          })
          .from(serverAgents)
          .where(inArray(serverAgents.key, unknownAgentIds)),
      ]);

      for (const la of [...externalResults, ...serverResults]) {
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
