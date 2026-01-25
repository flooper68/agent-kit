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

export const googleDriveConnections = pgTable(
  'google_drive_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Ownership - user/org (required)
    userId: varchar('user_id', { length: 255 }).notNull(),
    orgId: varchar('org_id', { length: 255 }).notNull(),

    // Google account info
    googleEmail: varchar('google_email', { length: 255 }).notNull(),

    // OAuth tokens (encrypted)
    accessTokenEncrypted: text('access_token_encrypted').notNull(),
    refreshTokenEncrypted: text('refresh_token_encrypted').notNull(),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),

    // Selected folder
    folderId: varchar('folder_id', { length: 255 }),
    folderName: varchar('folder_name', { length: 255 }),

    // Connection state
    isActive: boolean('is_active').notNull().default(true),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // User can only have one connection per org
    uniqueIndex('google_drive_connections_user_org_unique_idx').on(
      table.userId,
      table.orgId
    ),
    index('google_drive_connections_org_id_idx').on(table.orgId),
  ]
);

export type GoogleDriveConnection = typeof googleDriveConnections.$inferSelect;
export type NewGoogleDriveConnection =
  typeof googleDriveConnections.$inferInsert;
