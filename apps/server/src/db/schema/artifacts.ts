import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  index,
} from 'drizzle-orm/pg-core';

export type ArtifactFormat = 'markdown';

export const artifacts = pgTable(
  'artifacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Ownership - user/org (required)
    userId: varchar('user_id', { length: 255 }).notNull(),
    orgId: varchar('org_id', { length: 255 }).notNull(),

    // Optional associations (no FK constraints for flexibility)
    sessionId: uuid('session_id'),
    agentId: varchar('agent_id', { length: 64 }),

    // Core content
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    format: varchar('format', { length: 32 })
      .$type<ArtifactFormat>()
      .notNull()
      .default('markdown'),

    // LLM-generated summary for search
    summary: text('summary'),

    // Metadata
    sizeBytes: integer('size_bytes').notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('artifacts_org_id_user_id_idx').on(table.orgId, table.userId),
    index('artifacts_org_id_created_at_idx').on(table.orgId, table.createdAt),
    index('artifacts_agent_id_idx').on(table.agentId),
  ]
);

export type Artifact = typeof artifacts.$inferSelect;
export type NewArtifact = typeof artifacts.$inferInsert;
