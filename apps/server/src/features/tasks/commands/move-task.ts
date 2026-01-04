import { eq, and, gte, lte, ne, sql } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  tasks,
  type Task,
  type TaskEvent,
  type TaskStatus,
} from '../../../db/schema';
import type { MoveTaskInput } from '../types';

export class MoveTaskCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: MoveTaskInput): Promise<Task | undefined> {
    return await this.db.transaction(async (tx) => {
      // Get the current task
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

      const oldStatus = currentTask.status;
      const oldPosition = currentTask.position;
      const newStatus = input.status;
      const newPosition = input.position;

      const events: TaskEvent[] = [...(currentTask.events ?? [])];

      // Track status change
      if (oldStatus !== newStatus) {
        events.push({
          type: 'status_changed',
          timestamp: new Date().toISOString(),
          userId: input.userId,
          details: {
            from: oldStatus,
            to: newStatus,
          },
        });
      }

      // Determine completedAt
      let completedAt = currentTask.completedAt;
      if (newStatus === 'done' && oldStatus !== 'done') {
        completedAt = new Date();
      } else if (newStatus !== 'done' && oldStatus === 'done') {
        completedAt = null;
      }

      // Handle position reordering
      if (oldStatus === newStatus) {
        // Moving within the same column
        if (oldPosition < newPosition) {
          // Moving down - shift tasks between old and new position up
          await tx
            .update(tasks)
            .set({
              position: sql`${tasks.position} - 1`,
            })
            .where(
              and(
                eq(tasks.projectId, currentTask.projectId),
                eq(tasks.status, oldStatus),
                gte(tasks.position, oldPosition),
                lte(tasks.position, newPosition),
                ne(tasks.id, input.id)
              )
            );
        } else if (oldPosition > newPosition) {
          // Moving up - shift tasks between new and old position down
          await tx
            .update(tasks)
            .set({
              position: sql`${tasks.position} + 1`,
            })
            .where(
              and(
                eq(tasks.projectId, currentTask.projectId),
                eq(tasks.status, oldStatus),
                gte(tasks.position, newPosition),
                lte(tasks.position, oldPosition),
                ne(tasks.id, input.id)
              )
            );
        }
      } else {
        // Moving to a different column
        // Shift tasks in old column up (fill the gap)
        await tx
          .update(tasks)
          .set({
            position: sql`${tasks.position} - 1`,
          })
          .where(
            and(
              eq(tasks.projectId, currentTask.projectId),
              eq(tasks.status, oldStatus),
              gte(tasks.position, oldPosition),
              ne(tasks.id, input.id)
            )
          );

        // Shift tasks in new column down (make room)
        await tx
          .update(tasks)
          .set({
            position: sql`${tasks.position} + 1`,
          })
          .where(
            and(
              eq(tasks.projectId, currentTask.projectId),
              eq(tasks.status, newStatus as TaskStatus),
              gte(tasks.position, newPosition)
            )
          );
      }

      // Update the task itself
      const [updatedTask] = await tx
        .update(tasks)
        .set({
          status: newStatus,
          position: newPosition,
          completedAt,
          events,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, input.id))
        .returning();

      return updatedTask;
    });
  }
}
