import { eq, and, gte, lte, ne, sql, asc } from 'drizzle-orm';
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

  /**
   * Normalize positions for a status column to ensure sequential values (0, 1, 2, ...)
   * This fixes any gaps or duplicates in positions.
   */
  private async normalizePositions(
    tx: Parameters<Parameters<typeof this.db.transaction>[0]>[0],
    projectId: string,
    status: TaskStatus
  ): Promise<void> {
    // Get all tasks in this column ordered by position, then createdAt for stability
    const columnTasks = await tx
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), eq(tasks.status, status)))
      .orderBy(asc(tasks.position), asc(tasks.createdAt));

    // Update each task to have sequential position
    for (let i = 0; i < columnTasks.length; i++) {
      const task = columnTasks[i];
      if (task) {
        await tx
          .update(tasks)
          .set({ position: i })
          .where(eq(tasks.id, task.id));
      }
    }
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
      const newStatus = input.status;
      const newPosition = input.position;

      // Normalize positions in the source column to handle duplicates/gaps
      await this.normalizePositions(tx, currentTask.projectId, oldStatus);

      // If moving to a different column, normalize that too
      if (oldStatus !== newStatus) {
        await this.normalizePositions(
          tx,
          currentTask.projectId,
          newStatus as TaskStatus
        );
      }

      // Re-fetch the task to get its normalized position
      const [normalizedTask] = await tx
        .select()
        .from(tasks)
        .where(eq(tasks.id, input.id))
        .limit(1);

      if (!normalizedTask) {
        return undefined;
      }

      const oldPosition = normalizedTask.position;

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
