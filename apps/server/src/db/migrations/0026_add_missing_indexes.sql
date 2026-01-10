-- Add missing indexes for query performance

-- Index for user-scoped session queries
CREATE INDEX IF NOT EXISTS "agent_sessions_user_id_idx" ON "agent_sessions" USING btree ("user_id");

-- Index for fetching messages by session
CREATE INDEX IF NOT EXISTS "agent_session_messages_session_id_idx" ON "agent_session_messages" USING btree ("session_id");

-- Indexes for agent_session_events
CREATE INDEX IF NOT EXISTS "agent_session_events_session_id_idx" ON "agent_session_events" USING btree ("session_id");
CREATE INDEX IF NOT EXISTS "agent_session_events_message_id_idx" ON "agent_session_events" USING btree ("message_id");
CREATE INDEX IF NOT EXISTS "agent_session_events_session_sequence_idx" ON "agent_session_events" USING btree ("session_id", "sequence");
