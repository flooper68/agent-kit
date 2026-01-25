-- Add scheduled_jobs table for cron-based agent spawn scheduling
CREATE TABLE IF NOT EXISTS "scheduled_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar(255) NOT NULL,
  "org_id" varchar(255) NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "cron_expression" varchar(100) NOT NULL,
  "timezone" varchar(100) NOT NULL DEFAULT 'UTC',
  "agent_id" varchar(255) NOT NULL,
  "message" text NOT NULL,
  "timeout" integer,
  "enabled" boolean NOT NULL DEFAULT true,
  "last_run_at" timestamp with time zone,
  "next_run_at" timestamp with time zone,
  "last_run_status" varchar(20),
  "last_session_id" uuid,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS "scheduled_jobs_org_id_user_id_idx" ON "scheduled_jobs" ("org_id", "user_id");
CREATE INDEX IF NOT EXISTS "scheduled_jobs_next_run_at_idx" ON "scheduled_jobs" ("next_run_at");
CREATE INDEX IF NOT EXISTS "scheduled_jobs_enabled_idx" ON "scheduled_jobs" ("enabled");
