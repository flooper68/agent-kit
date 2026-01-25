import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { artifacts } from './artifacts';
import { googleDriveConnections } from './google-drive-connections';

export const syncStatusEnum = pgEnum('sync_status', [
  'pending',
  'syncing',
  'synced',
  'failed',
  'error',
]);

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'error';

export const artifactDriveSync = pgTable(
  'artifact_drive_sync',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Foreign keys
    artifactId: uuid('artifact_id')
      .notNull()
      .references(() => artifacts.id, { onDelete: 'cascade' }),
    connectionId: uuid('connection_id')
      .notNull()
      .references(() => googleDriveConnections.id, { onDelete: 'cascade' }),

    // Drive file reference
    driveFileId: varchar('drive_file_id', { length: 255 }),

    // Sync status
    syncStatus: syncStatusEnum('sync_status').notNull().default('pending'),

    // Sync metadata
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    lastError: text('last_error'),
    retryCount: integer('retry_count').notNull().default(0),

    // Content hash for change detection
    contentHash: varchar('content_hash', { length: 64 }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Each artifact can only have one sync record per connection
    index('artifact_drive_sync_artifact_id_idx').on(table.artifactId),
    index('artifact_drive_sync_connection_id_idx').on(table.connectionId),
    index('artifact_drive_sync_status_idx').on(table.syncStatus),
  ]
);

export type ArtifactDriveSync = typeof artifactDriveSync.$inferSelect;
export type NewArtifactDriveSync = typeof artifactDriveSync.$inferInsert;
