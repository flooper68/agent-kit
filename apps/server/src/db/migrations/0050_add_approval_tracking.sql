-- Add approver tracking columns to agent_session_events
ALTER TABLE "agent_session_events" ADD COLUMN "approved_by_user_id" varchar(64);
ALTER TABLE "agent_session_events" ADD COLUMN "approved_at" timestamp with time zone;
