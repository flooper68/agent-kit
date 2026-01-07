-- Add foreign key constraint for parent_session_id
-- Using ON DELETE SET NULL so child sessions aren't deleted when parent is deleted
ALTER TABLE "agent_sessions"
ADD CONSTRAINT "fk_agent_sessions_parent_session"
FOREIGN KEY ("parent_session_id")
REFERENCES "agent_sessions"("id")
ON DELETE SET NULL;
