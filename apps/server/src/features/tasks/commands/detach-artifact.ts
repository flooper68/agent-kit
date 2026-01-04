import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { tasks, taskArtifacts, type TaskEvent } from '../../../db/schema';

export class DetachArtifactCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    taskId: string,
    artifactId: string,
    userId: string,
    orgId: string
  ): Promise<boolean> {
    // Verify task ownership
    const [task] = await this.db
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
    const [deleted] = await this.db
      .delete(taskArtifacts)
      .where(
        and(
          eq(taskArtifacts.taskId, taskId),
          eq(taskArtifacts.artifactId, artifactId)
        )
      )
      .returning();

    if (!deleted) {
      return false; // Wasn't attached
    }

    // Add event to task
    const events: TaskEvent[] = [...(task.events ?? [])];
    events.push({
      type: 'artifact_detached',
      timestamp: new Date().toISOString(),
      userId,
      details: { artifactId },
    });

    await this.db
      .update(tasks)
      .set({ events, updatedAt: new Date() })
      .where(eq(tasks.id, taskId));

    return true;
  }
}
