-- Add index on agent_sessions.agent_id for faster lookups
CREATE INDEX IF NOT EXISTS "agent_sessions_agent_id_idx" ON "agent_sessions" USING btree ("agent_id");
