-- Add org_id column to agent_sessions for organization-level isolation
-- This enables proper multi-tenancy by filtering sessions by organization

-- Add the column as nullable first
ALTER TABLE "agent_sessions" ADD COLUMN "org_id" varchar(255);

-- For existing sessions, we'll set org_id to a placeholder that can be updated
-- In production, you'd want to migrate existing data based on user->org mappings
UPDATE "agent_sessions" SET "org_id" = 'default' WHERE "org_id" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "agent_sessions" ALTER COLUMN "org_id" SET NOT NULL;

-- Add index for efficient filtering by org_id
CREATE INDEX IF NOT EXISTS "agent_sessions_org_id_idx" ON "agent_sessions" ("org_id");

-- Add composite index for common query pattern
CREATE INDEX IF NOT EXISTS "agent_sessions_org_id_user_id_idx" ON "agent_sessions" ("org_id", "user_id");
