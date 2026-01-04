import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { tasks, taskArtifacts, artifacts } from '../../../db/schema';
import type { TaskWithDetails, ArtifactSummary } from '../types';

export class GetTaskByIdQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    id: string,
    userId: string,
    orgId: string
  ): Promise<TaskWithDetails | undefined> {
    // Get the task
    const [task] = await this.db
      .select()
      .from(tasks)
      .where(
        and(eq(tasks.id, id), eq(tasks.userId, userId), eq(tasks.orgId, orgId))
      )
      .limit(1);

    if (!task) {
      return undefined;
    }

    // Get attached artifacts
    const attachedArtifacts = await this.db
      .select({
        id: artifacts.id,
        title: artifacts.title,
        format: artifacts.format,
        createdAt: artifacts.createdAt,
      })
      .from(taskArtifacts)
      .innerJoin(artifacts, eq(taskArtifacts.artifactId, artifacts.id))
      .where(eq(taskArtifacts.taskId, id));

    const artifactSummaries: ArtifactSummary[] = attachedArtifacts.map((a) => ({
      id: a.id,
      title: a.title,
      format: a.format,
      createdAt: a.createdAt,
    }));

    return {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      position: task.position,
      completedAt: task.completedAt,
      events: task.events ?? [],
      artifacts: artifactSummaries,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
