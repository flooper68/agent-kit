-- Add allowed_subagents column to both agent tables
-- This is an allowlist of agent keys that this agent can spawn
-- Empty array [] means the agent cannot spawn any sub-agents (restrictive by default)

ALTER TABLE "server_agents" ADD COLUMN IF NOT EXISTS "allowed_subagents" jsonb NOT NULL DEFAULT '[]';
ALTER TABLE "external_agents" ADD COLUMN IF NOT EXISTS "allowed_subagents" jsonb NOT NULL DEFAULT '[]';
