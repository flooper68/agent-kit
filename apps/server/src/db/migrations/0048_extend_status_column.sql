-- Extend status column to accommodate 'awaiting_approval' (17 chars)
ALTER TABLE "agent_session_messages" ALTER COLUMN "status" TYPE varchar(32);
