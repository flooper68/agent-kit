import { eq, and, count } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  googleDriveConnections,
  artifactDriveSync,
  type ArtifactDriveSync,
  type SyncStatus,
} from '../../../db/schema';

export interface GetSyncStatusInput {
  artifactId: string;
  userId: string;
  orgId: string;
}

export type GetSyncStatusResult = ArtifactDriveSync | undefined;

export interface GetSyncStatsInput {
  userId: string;
  orgId: string;
}

export interface SyncStats {
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
  error: number;
  total: number;
}

export type GetSyncStatsResult = SyncStats;

export class GetSyncStatusQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: GetSyncStatusInput): Promise<GetSyncStatusResult> {
    const { artifactId, userId, orgId } = input;

    // First get the connection for this user/org
    const [connection] = await this.db
      .select()
      .from(googleDriveConnections)
      .where(
        and(
          eq(googleDriveConnections.userId, userId),
          eq(googleDriveConnections.orgId, orgId)
        )
      )
      .limit(1);

    if (!connection) {
      return undefined;
    }

    const [syncStatus] = await this.db
      .select()
      .from(artifactDriveSync)
      .where(
        and(
          eq(artifactDriveSync.artifactId, artifactId),
          eq(artifactDriveSync.connectionId, connection.id)
        )
      )
      .limit(1);

    return syncStatus;
  }
}

export class GetSyncStatsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: GetSyncStatsInput): Promise<GetSyncStatsResult> {
    const { userId, orgId } = input;

    // Get the connection for this user/org
    const [connection] = await this.db
      .select()
      .from(googleDriveConnections)
      .where(
        and(
          eq(googleDriveConnections.userId, userId),
          eq(googleDriveConnections.orgId, orgId)
        )
      )
      .limit(1);

    if (!connection) {
      return {
        pending: 0,
        syncing: 0,
        synced: 0,
        failed: 0,
        error: 0,
        total: 0,
      };
    }

    // Count by status
    const statusCounts = await this.db
      .select({
        status: artifactDriveSync.syncStatus,
        count: count(),
      })
      .from(artifactDriveSync)
      .where(eq(artifactDriveSync.connectionId, connection.id))
      .groupBy(artifactDriveSync.syncStatus);

    const stats: SyncStats = {
      pending: 0,
      syncing: 0,
      synced: 0,
      failed: 0,
      error: 0,
      total: 0,
    };

    for (const row of statusCounts) {
      const status = row.status as SyncStatus;
      stats[status] = row.count;
      stats.total += row.count;
    }

    return stats;
  }
}
