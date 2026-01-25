import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  googleDriveConnections,
  type GoogleDriveConnection,
} from '../../../db/schema';

export interface UpdateFolderInput {
  userId: string;
  orgId: string;
  folderId: string;
  folderName: string;
}

export type UpdateFolderResult = GoogleDriveConnection | undefined;

export class UpdateFolderCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: UpdateFolderInput): Promise<UpdateFolderResult> {
    const { userId, orgId, folderId, folderName } = input;

    const [updated] = await this.db
      .update(googleDriveConnections)
      .set({
        folderId,
        folderName,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(googleDriveConnections.userId, userId),
          eq(googleDriveConnections.orgId, orgId)
        )
      )
      .returning();

    return updated;
  }
}
