import type { db as DbType } from '../../../db';
import { projects, type Project } from '../../../db/schema';

export interface CreateProjectInput {
  userId: string;
  orgId: string;
  title: string;
  summary?: string;
}

export type CreateProjectResult = Project;

export class CreateProjectCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: CreateProjectInput): Promise<CreateProjectResult> {
    const [project] = await this.db
      .insert(projects)
      .values({
        userId: input.userId,
        orgId: input.orgId,
        title: input.title,
        summary: input.summary,
      })
      .returning();

    if (!project) {
      throw new Error('Failed to create project');
    }

    return project;
  }
}
