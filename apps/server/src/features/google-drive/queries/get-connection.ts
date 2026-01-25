import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  googleDriveConnections,
  type GoogleDriveConnection,
} from '../../../db/schema';

export interface GetConnectionInput {
  userId: string;
  orgId: string;
}

export type GetConnectionResult = GoogleDriveConnection | undefined;

export class GetConnectionQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: GetConnectionInput): Promise<GetConnectionResult> {
    const { userId, orgId } = input;

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

    return connection;
  }
}
