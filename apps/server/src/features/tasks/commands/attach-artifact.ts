import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  tasks,
  taskArtifacts,
  artifacts,
  type TaskEvent,
} from '../../../db/schema';

export class AttachArtifactCommand {
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

    // Verify artifact ownership
    const [artifact] = await this.db
      .select({ id: artifacts.id })
      .from(artifacts)
      .where(
        and(
          eq(artifacts.id, artifactId),
          eq(artifacts.userId, userId),
          eq(artifacts.orgId, orgId)
        )
      )
      .limit(1);

    if (!artifact) {
      throw new Error('Artifact not found');
    }

    // Check if already attached
    const [existing] = await this.db
      .select({ id: taskArtifacts.id })
      .from(taskArtifacts)
      .where(
        and(
          eq(taskArtifacts.taskId, taskId),
          eq(taskArtifacts.artifactId, artifactId)
        )
      )
      .limit(1);

    if (existing) {
      return false; // Already attached
    }

    // Create the attachment
    await this.db.insert(taskArtifacts).values({
      taskId,
      artifactId,
    });

    // Add event to task
    const events: TaskEvent[] = [...(task.events ?? [])];
    events.push({
      type: 'artifact_attached',
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
