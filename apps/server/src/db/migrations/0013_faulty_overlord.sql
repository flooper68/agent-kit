-- Add key column as nullable first
ALTER TABLE "local_agents" ADD COLUMN "key" varchar(64);--> statement-breakpoint

-- Backfill existing agents with first 8 chars of their UUID
UPDATE "local_agents" SET "key" = SUBSTRING(id::text, 1, 8) WHERE "key" IS NULL;--> statement-breakpoint

-- Make column NOT NULL after backfill
ALTER TABLE "local_agents" ALTER COLUMN "key" SET NOT NULL;--> statement-breakpoint

-- Add index for parent session lookups (picked up from schema)
-- Use IF NOT EXISTS since this index may have been created in 0012
CREATE INDEX IF NOT EXISTS "idx_agent_sessions_parent_session_id" ON "agent_sessions" USING btree ("parent_session_id");--> statement-breakpoint

-- Add unique index for per-user key uniqueness
CREATE UNIQUE INDEX "local_agents_user_key_idx" ON "local_agents" USING btree ("user_id","key");
