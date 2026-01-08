-- Migration: Drop old builtin agents table
-- The builtin agents concept has been removed - all agents are now user-created
-- Sessions referencing old builtin agents will display the agentId as the agent name

DROP TABLE IF EXISTS "agents";
