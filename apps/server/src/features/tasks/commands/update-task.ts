import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  tasks,
  type Task,
  type TaskEvent,
  type TaskPriority,
  type TaskStatus,
} from '../../../db/schema';
import type { UpdateTaskInput } from '../types';

export class UpdateTaskCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: UpdateTaskInput): Promise<Task | undefined> {
    // Validate description length if provided
    if (input.description !== undefined && input.description !== null) {
      if (input.description.length > 5000) {
        throw new Error(
          'Description exceeds maximum length of 5000 characters'
        );
      }
    }

    return await this.db.transaction(async (tx) => {
      // Get the current task within transaction for consistency
      const [currentTask] = await tx
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.id, input.id),
            eq(tasks.userId, input.userId),
            eq(tasks.orgId, input.orgId)
          )
        )
        .limit(1);

      if (!currentTask) {
        return undefined;
      }

      const updates: Partial<{
        title: string;
        description: string | null;
        priority: TaskPriority;
        status: TaskStatus;
        completedAt: Date | null;
        updatedAt: Date;
        events: TaskEvent[];
      }> = {
        updatedAt: new Date(),
      };

      const events: TaskEvent[] = [...(currentTask.events ?? [])];

      // Track status changes
      if (input.status !== undefined && input.status !== currentTask.status) {
        events.push({
          type: 'status_changed',
          timestamp: new Date().toISOString(),
          userId: input.userId,
          details: {
            from: currentTask.status,
            to: input.status,
          },
        });
        updates.status = input.status;
        // Set completedAt when moving to done, clear it otherwise
        if (input.status === 'done') {
          updates.completedAt = new Date();
        } else if (currentTask.status === 'done') {
          updates.completedAt = null;
        }
      }

      // Track priority changes
      if (
        input.priority !== undefined &&
        input.priority !== currentTask.priority
      ) {
        events.push({
          type: 'priority_changed',
          timestamp: new Date().toISOString(),
          userId: input.userId,
          details: {
            from: currentTask.priority,
            to: input.priority,
          },
        });
        updates.priority = input.priority;
      }

      // Track other updates
      const changes: Record<string, unknown> = {};
      if (input.title !== undefined && input.title !== currentTask.title) {
        updates.title = input.title;
        changes.title = { from: currentTask.title, to: input.title };
      }

      if (
        input.description !== undefined &&
        input.description !== currentTask.description
      ) {
        updates.description = input.description;
        changes.description = {
          from: currentTask.description,
          to: input.description,
        };
      }

      // Add general update event if there are non-priority changes
      if (Object.keys(changes).length > 0) {
        events.push({
          type: 'updated',
          timestamp: new Date().toISOString(),
          userId: input.userId,
          details: { changes },
        });
      }

      updates.events = events;

      const [task] = await tx
        .update(tasks)
        .set(updates)
        .where(
          and(
            eq(tasks.id, input.id),
            eq(tasks.userId, input.userId),
            eq(tasks.orgId, input.orgId)
          )
        )
        .returning();

      return task;
    });
  }
}
