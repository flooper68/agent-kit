ALTER TABLE "agent_sessions" ADD COLUMN "parent_session_id" uuid;--> statement-breakpoint
ALTER TABLE "agent_sessions" ADD COLUMN "spawn_depth" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agent_sessions_parent_session_id" ON "agent_sessions" ("parent_session_id") WHERE "parent_session_id" IS NOT NULL;