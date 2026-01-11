import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

/**
 * A file within a skill (e.g., SKILL.md, references/tips.md)
 */
export interface SkillFile {
  path: string;
  content: string;
}

export const skills = pgTable(
  'skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Unique key for the skill (e.g., "web-research")
    key: varchar('key', { length: 64 }).notNull(),

    // Display name (e.g., "Web Research")
    name: varchar('name', { length: 255 }).notNull(),

    // Description for discovery
    description: text('description').notNull(),

    // Files stored as JSONB array of {path, content}
    files: jsonb('files').$type<SkillFile[]>().notNull().default([]),

    // System skills are read-only and shared across all users
    isSystem: boolean('is_system').notNull().default(false),

    // Ownership - null for system skills
    userId: varchar('user_id', { length: 255 }),
    orgId: varchar('org_id', { length: 255 }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('skills_org_id_key_idx').on(table.orgId, table.key),
    index('skills_is_system_idx').on(table.isSystem),
    index('skills_user_id_idx').on(table.userId),
  ]
);

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
