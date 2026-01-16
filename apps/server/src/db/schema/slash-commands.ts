import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const slashCommands = pgTable(
  'slash_commands',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Command trigger (without the slash, e.g., "review" for "/review")
    key: varchar('key', { length: 64 }).notNull(),

    // Display name (e.g., "Code Review")
    name: varchar('name', { length: 255 }).notNull(),

    // Brief description for autocomplete dropdown
    description: text('description'),

    // The full prompt that gets expanded when the command is used
    prompt: text('prompt').notNull(),

    // Ownership - per user, scoped to organization
    userId: varchar('user_id', { length: 255 }).notNull(),
    orgId: varchar('org_id', { length: 255 }).notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Unique constraint: one command key per user per org
    uniqueIndex('slash_commands_org_user_key_idx').on(
      table.orgId,
      table.userId,
      table.key
    ),
    index('slash_commands_org_user_idx').on(table.orgId, table.userId),
    index('slash_commands_org_created_idx').on(table.orgId, table.createdAt),
  ]
);

export type SlashCommand = typeof slashCommands.$inferSelect;
export type NewSlashCommand = typeof slashCommands.$inferInsert;
