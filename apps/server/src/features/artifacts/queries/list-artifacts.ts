import { eq, desc, lt, and, or, ilike, type SQL } from 'drizzle-orm';
import { escapeLikePattern } from '../../../lib/db/escape-like';
import type { db as DbType } from '../../../db';
import { artifacts } from '../../../db/schema';

export interface ListArtifactsInput {
  userId: string;
  orgId: string;
  limit: number;
  cursor?: string;
  search?: string;
}

export interface ArtifactListItem {
  id: string;
  title: string;
  summary: string | null;
  format: string;
  sizeBytes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListArtifactsResult {
  items: ArtifactListItem[];
  nextCursor: string | undefined;
}

export class ListArtifactsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: ListArtifactsInput): Promise<ListArtifactsResult> {
    const { userId, orgId, limit, cursor, search } = input;

    // If cursor is provided, get the cursor artifact's createdAt for filtering
    let cursorDate: Date | undefined;
    if (cursor) {
      const cursorArtifact = await this.db
        .select({ createdAt: artifacts.createdAt })
        .from(artifacts)
        .where(eq(artifacts.id, cursor))
        .limit(1);

      // If cursor artifact was deleted, return empty results to indicate invalid cursor
      if (cursorArtifact.length === 0) {
        return { items: [], nextCursor: undefined };
      }

      cursorDate = cursorArtifact[0]?.createdAt;
    }

    // Build the where conditions
    const conditions: SQL[] = [
      eq(artifacts.orgId, orgId),
      eq(artifacts.userId, userId),
    ];

    if (cursorDate) {
      conditions.push(lt(artifacts.createdAt, cursorDate));
    }

    // Add search filter if provided
    if (search?.trim()) {
      const searchPattern = `%${escapeLikePattern(search.trim())}%`;
      conditions.push(
        or(
          ilike(artifacts.title, searchPattern),
          ilike(artifacts.summary, searchPattern)
        )!
      );
    }

    // Execute query
    const results = await this.db
      .select({
        id: artifacts.id,
        title: artifacts.title,
        summary: artifacts.summary,
        format: artifacts.format,
        sizeBytes: artifacts.sizeBytes,
        createdAt: artifacts.createdAt,
        updatedAt: artifacts.updatedAt,
      })
      .from(artifacts)
      .where(and(...conditions))
      .orderBy(desc(artifacts.createdAt))
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
