import { eq, and, sql } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  projects,
  tasks,
  taskArtifacts,
  type TaskStatus,
} from '../../../db/schema';
import type { ProjectWithTasks, TaskSummary } from '../types';

export class GetProjectByIdQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    id: string,
    userId: string,
    orgId: string
  ): Promise<ProjectWithTasks | undefined> {
    // Get the project
    const [project] = await this.db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, id),
          eq(projects.userId, userId),
          eq(projects.orgId, orgId)
        )
      )
      .limit(1);

    if (!project) {
      return undefined;
    }

    // Get tasks with artifact counts
    const tasksWithCounts = await this.db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        position: tasks.position,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        artifactCount: sql<number>`count(${taskArtifacts.id})::int`,
      })
      .from(tasks)
      .leftJoin(taskArtifacts, eq(tasks.id, taskArtifacts.taskId))
      .where(eq(tasks.projectId, id))
      .groupBy(tasks.id)
      .orderBy(tasks.position);

    // Group tasks by status
    const tasksByStatus: Record<TaskStatus, TaskSummary[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };

    for (const task of tasksWithCounts) {
      const summary: TaskSummary = {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        position: task.position,
        artifactCount: task.artifactCount,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      };
      tasksByStatus[task.status].push(summary);
    }

    return {
      id: project.id,
      title: project.title,
      summary: project.summary,
      tasksByStatus,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
