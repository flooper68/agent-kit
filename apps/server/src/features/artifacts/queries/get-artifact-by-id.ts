import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { artifacts, type Artifact } from '../../../db/schema';

export class GetArtifactByIdQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    id: string,
    userId: string,
    orgId: string
  ): Promise<Artifact | undefined> {
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
