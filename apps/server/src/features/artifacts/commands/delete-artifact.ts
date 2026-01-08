import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { artifacts, type Artifact } from '../../../db/schema';

export interface DeleteArtifactInput {
  id: string;
  userId: string;
  orgId: string;
}

export type DeleteArtifactResult = Artifact | undefined;

export class DeleteArtifactCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: DeleteArtifactInput): Promise<DeleteArtifactResult> {
    const { id, userId, orgId } = input;
    const [deleted] = await this.db
      .delete(artifacts)
      .where(
        and(
          eq(artifacts.id, id),
          eq(artifacts.userId, userId),
          eq(artifacts.orgId, orgId)
        )
      )
      .returning();

    return deleted;
  }
}
