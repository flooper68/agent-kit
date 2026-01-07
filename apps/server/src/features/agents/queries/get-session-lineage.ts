import { sql } from 'drizzle-orm';
import type { db as DbType } from '../../../db';

/**
 * Lineage item representing a session in the hierarchy path
 */
export interface LineageItem {
  sessionId: string;
  title: string | null;
  agentId: string;
  depth: number;
}

interface LineageRow extends Record<string, unknown> {
  sessionId: string;
  title: string | null;
  agentId: string;
  depth: number;
}

/**
 * Query to get the full lineage (path from root to current session)
 * Uses a recursive CTE to traverse the parent chain
 */
export class GetSessionLineageQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(sessionId: string): Promise<LineageItem[]> {
    // Use recursive CTE to traverse from target session up to root,
    // then order by depth descending (root first)
    const result = await this.db.execute<LineageRow>(sql`
      WITH RECURSIVE lineage AS (
        -- Base case: start with target session
        SELECT
          id as "sessionId",
          title,
          agent_id as "agentId",
          parent_session_id,
          0 as depth
        FROM agent_sessions
        WHERE id = ${sessionId}::uuid

        UNION ALL

        -- Recursive case: get parent
        SELECT
          s.id as "sessionId",
          s.title,
          s.agent_id as "agentId",
          s.parent_session_id,
          l.depth + 1
        FROM agent_sessions s
        JOIN lineage l ON s.id = l.parent_session_id
      )
      SELECT "sessionId", title, "agentId", depth
      FROM lineage
      ORDER BY depth DESC
    `);

    // The result is an array-like object (RowList), map to LineageItem array
    return [...result].map((row) => ({
      sessionId: row.sessionId,
      title: row.title,
      agentId: row.agentId,
      depth: row.depth,
    }));
  }
}
