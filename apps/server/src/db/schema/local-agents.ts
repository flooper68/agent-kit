import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const localAgents = pgTable(
  'local_agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Ownership - per-user (not shared with org)
    userId: varchar('user_id', { length: 255 }).notNull(),

    // Agent identity
    // key: unique per-user identifier for spawning (e.g., "code-reviewer")
    key: varchar('key', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),

    // Secret key hash (SHA256) - the actual key is only returned on create/regenerate
    secretKey: varchar('secret_key', { length: 255 }).notNull().unique(),

    // Display prefix for identification (e.g., "ak_local_abc1...")
    // Unique to ensure reliable lookup during HMAC auth
    secretKeyPrefix: varchar('secret_key_prefix', { length: 32 })
      .notNull()
      .unique(),

    // Soft delete - disabled agents are hidden from agent selector
    disabled: boolean('disabled').notNull().default(false),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('local_agents_user_id_idx').on(table.userId),
    index('local_agents_secret_key_idx').on(table.secretKey),
    // Per-user unique key for spawning
    uniqueIndex('local_agents_user_key_idx').on(table.userId, table.key),
  ]
);

export type LocalAgent = typeof localAgents.$inferSelect;
export type NewLocalAgent = typeof localAgents.$inferInsert;
