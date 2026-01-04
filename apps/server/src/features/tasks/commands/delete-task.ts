import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { tasks, type Task } from '../../../db/schema';

export class DeleteTaskCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    id: string,
    userId: string,
    orgId: string
  ): Promise<Task | undefined> {
    // Task artifacts will be cascade deleted due to FK constraint
    const [task] = await this.db
      .delete(tasks)
      .where(
        and(eq(tasks.id, id), eq(tasks.userId, userId), eq(tasks.orgId, orgId))
      )
      .returning();

    return task;
  }
}
