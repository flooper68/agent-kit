import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { projects, type Project } from '../../../db/schema';

export class DeleteProjectCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    id: string,
    userId: string,
    orgId: string
  ): Promise<Project | undefined> {
    // Tasks will be cascade deleted due to FK constraint
    const [project] = await this.db
      .delete(projects)
      .where(
        and(
          eq(projects.id, id),
          eq(projects.userId, userId),
          eq(projects.orgId, orgId)
        )
      )
      .returning();

    return project;
  }
}
