-- Google Drive connections table for OAuth credentials per user/org
CREATE TABLE google_drive_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  org_id VARCHAR(255) NOT NULL,

  -- Google account info
  google_email VARCHAR(255) NOT NULL,

  -- OAuth tokens (encrypted)
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,

  -- Selected folder
  folder_id VARCHAR(255),
  folder_name VARCHAR(255),

  -- Connection state
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

-- User can only have one connection per org
CREATE UNIQUE INDEX google_drive_connections_user_org_unique_idx ON google_drive_connections(user_id, org_id);
--> statement-breakpoint

-- Index for finding connections by org
CREATE INDEX google_drive_connections_org_id_idx ON google_drive_connections(org_id);
--> statement-breakpoint

-- Sync status enum
CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'synced', 'failed', 'error');
--> statement-breakpoint

-- Artifact drive sync table for tracking sync status per artifact
CREATE TABLE artifact_drive_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES google_drive_connections(id) ON DELETE CASCADE,

  -- Drive file reference
  drive_file_id VARCHAR(255),

  -- Sync status
  sync_status sync_status NOT NULL DEFAULT 'pending',

  -- Sync metadata
  last_synced_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,

  -- Content hash for change detection
  content_hash VARCHAR(64),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

-- Index for finding sync records by artifact
CREATE INDEX artifact_drive_sync_artifact_id_idx ON artifact_drive_sync(artifact_id);
--> statement-breakpoint

-- Index for finding sync records by connection
CREATE INDEX artifact_drive_sync_connection_id_idx ON artifact_drive_sync(connection_id);
--> statement-breakpoint

-- Index for finding sync records by status (for worker processing)
CREATE INDEX artifact_drive_sync_status_idx ON artifact_drive_sync(sync_status);
