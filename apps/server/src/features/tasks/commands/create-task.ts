import { eq, and, sql } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  tasks,
  projects,
  type Task,
  type TaskEvent,
  type TaskPriority,
  type TaskStatus,
} from '../../../db/schema';

export interface CreateTaskInput {
  projectId: string;
  userId: string;
  orgId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export type CreateTaskResult = Task;

export class CreateTaskCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: CreateTaskInput): Promise<CreateTaskResult> {
    return await this.db.transaction(async (tx) => {
      // Verify project ownership
      const [project] = await tx
        .select({ id: projects.id })
        .from(projects)
        .where(
          and(
            eq(projects.id, input.projectId),
            eq(projects.userId, input.userId),
            eq(projects.orgId, input.orgId)
          )
        )
        .limit(1);

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      const status = input.status ?? 'todo';

      // Get the next position for this project's status column (atomic within transaction)
      const [maxPosition] = await tx
        .select({
          maxPos: sql<number>`coalesce(max(${tasks.position}), -1)::int`,
        })
        .from(tasks)
        .where(
          and(eq(tasks.projectId, input.projectId), eq(tasks.status, status))
        );

      const position = (maxPosition?.maxPos ?? -1) + 1;

      // Create the initial event
      const createdEvent: TaskEvent = {
        type: 'created',
        timestamp: new Date().toISOString(),
        userId: input.userId,
      };

      const [task] = await tx
        .insert(tasks)
        .values({
          projectId: input.projectId,
          userId: input.userId,
          orgId: input.orgId,
          title: input.title,
          description: input.description,
          priority: input.priority ?? 'medium',
          status,
          position,
          events: [createdEvent],
        })
        .returning();

      if (!task) {
        throw new Error('Failed to create task');
      }

      return task;
    });
  }
}
