import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';

/**
 * User activity sessions track periods of user activity in the application.
 * A new session is created when a user becomes active after being inactive
 * for a threshold period (e.g., 30 minutes).
 *
 * Sessions aggregate metrics from agent sessions that occur during the activity period.
 */
export const userActivitySessions = pgTable(
  'user_activity_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    orgId: varchar('org_id', { length: 255 }).notNull(),

    // Session timing
    startedAt: timestamp('started_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Index for finding user's active/recent sessions
    index('idx_user_activity_sessions_user_org').on(table.userId, table.orgId),
    // Index for org-wide analytics queries
    index('idx_user_activity_sessions_org_started').on(
      table.orgId,
      table.startedAt
    ),
    // Index for heartbeat checks
    index('idx_user_activity_sessions_last_activity').on(
      table.userId,
      table.orgId,
      table.lastActivityAt
    ),
  ]
);

export type UserActivitySession = typeof userActivitySessions.$inferSelect;
export type NewUserActivitySession = typeof userActivitySessions.$inferInsert;
