import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  googleDriveConnections,
  artifactDriveSync,
  type ArtifactDriveSync,
} from '../../../db/schema';

export interface QueueSyncInput {
  artifactId: string;
  userId: string;
  orgId: string;
}

export type QueueSyncResult = ArtifactDriveSync | null;

export class QueueSyncCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  /**
   * Queue an artifact for sync if the user has an active connection
   * Returns the sync record if created/updated, null if no active connection
   */
  async execute(input: QueueSyncInput): Promise<QueueSyncResult> {
    const { artifactId, userId, orgId } = input;

    // Check for active connection with folder configured
    const [connection] = await this.db
      .select()
      .from(googleDriveConnections)
      .where(
        and(
          eq(googleDriveConnections.userId, userId),
          eq(googleDriveConnections.orgId, orgId),
          eq(googleDriveConnections.isActive, true)
        )
      )
      .limit(1);

    if (!connection || !connection.folderId) {
      return null;
    }

    // Check for existing sync record
    const [existing] = await this.db
      .select()
      .from(artifactDriveSync)
      .where(
        and(
          eq(artifactDriveSync.artifactId, artifactId),
          eq(artifactDriveSync.connectionId, connection.id)
        )
      )
      .limit(1);

    if (existing) {
      // Update to pending status for re-sync
      const [updated] = await this.db
        .update(artifactDriveSync)
        .set({
          syncStatus: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(artifactDriveSync.id, existing.id))
        .returning();

      return updated ?? null;
    }

    // Create new sync record
    const [syncRecord] = await this.db
      .insert(artifactDriveSync)
      .values({
        artifactId,
        connectionId: connection.id,
        syncStatus: 'pending',
      })
      .returning();

    return syncRecord ?? null;
  }
}
