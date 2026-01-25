import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  index,
} from 'drizzle-orm/pg-core';

/**
 * Scheduled jobs table - stores cron-based scheduled agent spawns
 */
export const scheduledJobs = pgTable(
  'scheduled_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    orgId: varchar('org_id', { length: 255 }).notNull(),

    // Job identification
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),

    // Scheduling
    cronExpression: varchar('cron_expression', { length: 100 }).notNull(), // e.g., "0 9 * * 1-5"
    timezone: varchar('timezone', { length: 100 }).notNull().default('UTC'),

    // Agent spawn configuration
    agentId: varchar('agent_id', { length: 255 }).notNull(), // Reference to server agent
    message: text('message').notNull(), // The task/prompt to send to the agent
    timeout: integer('timeout'), // Optional timeout in ms (default 900000 = 15min)

    // Status
    enabled: boolean('enabled').notNull().default(true),

    // Execution tracking
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    nextRunAt: timestamp('next_run_at', { withTimezone: true }),
    lastRunStatus: varchar('last_run_status', { length: 20 }), // 'success' | 'failed' | 'running'
    lastSessionId: uuid('last_session_id'), // Link to the created agent session

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('scheduled_jobs_org_id_user_id_idx').on(table.orgId, table.userId),
    index('scheduled_jobs_next_run_at_idx').on(table.nextRunAt),
    index('scheduled_jobs_enabled_idx').on(table.enabled),
  ]
);

export type ScheduledJob = typeof scheduledJobs.$inferSelect;
export type NewScheduledJob = typeof scheduledJobs.$inferInsert;
