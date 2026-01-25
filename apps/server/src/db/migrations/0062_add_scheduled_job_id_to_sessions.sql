-- Add scheduled_job_id column to agent_sessions for tracking cron-created sessions
ALTER TABLE "agent_sessions" ADD COLUMN "scheduled_job_id" uuid;

-- Index for efficient filtering of scheduled sessions
CREATE INDEX IF NOT EXISTS "idx_agent_sessions_scheduled_job_id" ON "agent_sessions" ("scheduled_job_id");

-- Foreign key constraint: preserve session history when job is deleted
ALTER TABLE "agent_sessions"
ADD CONSTRAINT "agent_sessions_scheduled_job_id_scheduled_jobs_id_fk"
FOREIGN KEY ("scheduled_job_id") REFERENCES "scheduled_jobs"("id") ON DELETE SET NULL;
