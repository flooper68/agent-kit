import { pgTable, uuid, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { artifacts } from './artifacts';

export const projectArtifacts = pgTable(
  'project_artifacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // References
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    artifactId: uuid('artifact_id')
      .notNull()
      .references(() => artifacts.id, { onDelete: 'cascade' }),

    // Timestamp
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('project_artifacts_project_id_idx').on(table.projectId),
    index('project_artifacts_artifact_id_idx').on(table.artifactId),
    // Unique constraint to prevent duplicate attachments
    unique('project_artifacts_project_artifact_unique').on(
      table.projectId,
      table.artifactId
    ),
  ]
);

export type ProjectArtifact = typeof projectArtifacts.$inferSelect;
export type NewProjectArtifact = typeof projectArtifacts.$inferInsert;
