import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  tasks,
  taskArtifacts,
  artifacts,
  type TaskEvent,
} from '../../../db/schema';

export interface AttachArtifactInput {
  taskId: string;
  artifactId: string;
  userId: string;
  orgId: string;
}

export interface AttachArtifactResult {
  success: boolean;
  projectId?: string;
}

export class AttachArtifactCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: AttachArtifactInput): Promise<AttachArtifactResult> {
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

      // Verify artifact ownership
      const [artifact] = await tx
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

      // Use INSERT ... ON CONFLICT DO NOTHING for atomic upsert
      const result = await tx
        .insert(taskArtifacts)
        .values({
          taskId,
          artifactId,
        })
        .onConflictDoNothing()
        .returning();

      if (result.length === 0) {
        return { success: false, projectId: task.projectId }; // Already attached
      }

      // Add event to task
      const events: TaskEvent[] = [...(task.events ?? [])];
      events.push({
        type: 'artifact_attached',
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
