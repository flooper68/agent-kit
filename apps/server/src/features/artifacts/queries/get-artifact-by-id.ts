import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { artifacts, type Artifact } from '../../../db/schema';

export interface GetArtifactByIdInput {
  id: string;
  userId: string;
  orgId: string;
}

export type GetArtifactByIdResult = Artifact | undefined;

export class GetArtifactByIdQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: GetArtifactByIdInput): Promise<GetArtifactByIdResult> {
    const { id, userId, orgId } = input;
    const [artifact] = await this.db
      .select()
      .from(artifacts)
      .where(
        and(
          eq(artifacts.id, id),
          eq(artifacts.userId, userId),
          eq(artifacts.orgId, orgId)
        )
      )
      .limit(1);

    return artifact;
  }
}
