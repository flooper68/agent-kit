import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { projects, type Project } from '../../../db/schema';

export interface UpdateProjectInput {
  id: string;
  userId: string;
  orgId: string;
  title?: string;
  summary?: string | null;
}

export type UpdateProjectResult = Project | undefined;

export class UpdateProjectCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: UpdateProjectInput): Promise<UpdateProjectResult> {
    const updates: Partial<{
      title: string;
      summary: string | null;
      updatedAt: Date;
    }> = {
      updatedAt: new Date(),
    };

    if (input.title !== undefined) {
      updates.title = input.title;
    }

    if (input.summary !== undefined) {
      updates.summary = input.summary;
    }

    const [project] = await this.db
      .update(projects)
      .set(updates)
      .where(
        and(
          eq(projects.id, input.id),
          eq(projects.userId, input.userId),
          eq(projects.orgId, input.orgId)
        )
      )
      .returning();

    return project;
  }
}
