import { pgTable, uuid, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { tasks } from './tasks';
import { artifacts } from './artifacts';

export const taskArtifacts = pgTable(
  'task_artifacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // References
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    artifactId: uuid('artifact_id')
      .notNull()
      .references(() => artifacts.id, { onDelete: 'cascade' }),

    // Timestamp
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('task_artifacts_task_id_idx').on(table.taskId),
    index('task_artifacts_artifact_id_idx').on(table.artifactId),
    // Unique constraint to prevent duplicate attachments
    unique('task_artifacts_task_artifact_unique').on(
      table.taskId,
      table.artifactId
    ),
  ]
);

export type TaskArtifact = typeof taskArtifacts.$inferSelect;
export type NewTaskArtifact = typeof taskArtifacts.$inferInsert;
