-- Migration: Rename local_agents table to agents
-- This completes the transition from the old agents table to the new unified agents table

-- Step 1: Drop indexes that reference the old table name
DROP INDEX IF EXISTS "local_agents_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "local_agents_secret_key_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "local_agents_user_key_idx";--> statement-breakpoint

-- Step 2: Rename the table
ALTER TABLE "local_agents" RENAME TO "agents";--> statement-breakpoint

-- Step 3: Recreate indexes with new names
CREATE INDEX "agents_user_id_idx" ON "agents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agents_secret_key_idx" ON "agents" USING btree ("secret_key");--> statement-breakpoint
CREATE UNIQUE INDEX "agents_user_key_idx" ON "agents" USING btree ("user_id", "key");
