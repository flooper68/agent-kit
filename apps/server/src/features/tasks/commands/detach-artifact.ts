import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { tasks, taskArtifacts, type TaskEvent } from '../../../db/schema';

export interface DetachArtifactInput {
  taskId: string;
  artifactId: string;
  userId: string;
  orgId: string;
}

export interface DetachArtifactResult {
  success: boolean;
  projectId?: string;
}

export class DetachArtifactCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: DetachArtifactInput): Promise<DetachArtifactResult> {
    const { taskId, artifactId, userId, orgId } = input;
    return await this.db.transaction(async (tx) => {
      // Verify task ownership
      const [task] = await tx
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.id, taskId),
            eq(tasks.userId, userId),
            eq(tasks.orgId, orgId)
          )
        )
        .limit(1);

      if (!task) {
        throw new Error('Task not found');
      }

      // Delete the attachment
      const [deleted] = await tx
        .delete(taskArtifacts)
        .where(
          and(
            eq(taskArtifacts.taskId, taskId),
            eq(taskArtifacts.artifactId, artifactId)
          )
        )
        .returning();

      if (!deleted) {
        return { success: false, projectId: task.projectId }; // Wasn't attached
      }

      // Add event to task
      const events: TaskEvent[] = [...(task.events ?? [])];
      events.push({
        type: 'artifact_detached',
        timestamp: new Date().toISOString(),
        userId,
        details: { artifactId },
      });

      await tx
        .update(tasks)
        .set({ events, updatedAt: new Date() })
        .where(eq(tasks.id, taskId));

      return { success: true, projectId: task.projectId };
    });
  }
}
