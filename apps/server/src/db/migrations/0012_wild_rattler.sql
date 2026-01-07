ALTER TABLE "agent_sessions" ADD COLUMN "parent_session_id" uuid;--> statement-breakpoint
ALTER TABLE "agent_sessions" ADD COLUMN "spawn_depth" integer DEFAULT 0 NOT NULL;