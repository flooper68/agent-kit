import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  googleDriveConnections,
  artifactDriveSync,
  type GoogleDriveConnection,
} from '../../../db/schema';

export interface DisconnectGoogleDriveInput {
  userId: string;
  orgId: string;
}

export type DisconnectGoogleDriveResult = GoogleDriveConnection | undefined;

export class DisconnectGoogleDriveCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: DisconnectGoogleDriveInput
  ): Promise<DisconnectGoogleDriveResult> {
    const { userId, orgId } = input;

    // Find the connection
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

    // Delete all sync records for this connection
    await this.db
      .delete(artifactDriveSync)
      .where(eq(artifactDriveSync.connectionId, connection.id));

    // Delete the connection (cascade will handle sync records if still present)
    const [deleted] = await this.db
      .delete(googleDriveConnections)
      .where(eq(googleDriveConnections.id, connection.id))
      .returning();

    return deleted;
  }
}
