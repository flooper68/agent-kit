import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
  index,
} from 'drizzle-orm/pg-core';

export const localAgents = pgTable(
  'local_agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Ownership - per-user (not shared with org)
    userId: varchar('user_id', { length: 255 }).notNull(),

    // Agent configuration
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    systemPrompt: text('system_prompt').notNull(),
    provider: varchar('provider', { length: 64 }).notNull().default('openai'),
    model: varchar('model', { length: 64 }).notNull().default('gpt-5-mini'),
    tools: jsonb('tools').$type<string[]>().notNull().default([]),

    // Secret key with prefix ak_local_
    secretKey: varchar('secret_key', { length: 255 }).notNull().unique(),

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
  ]
);

export type LocalAgent = typeof localAgents.$inferSelect;
export type NewLocalAgent = typeof localAgents.$inferInsert;
