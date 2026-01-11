-- Add scopes column to server_agents
-- Stores array of scope strings, defaults to empty array (no permissions)
ALTER TABLE server_agents
ADD COLUMN scopes jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Add scopes column to external_agents
ALTER TABLE external_agents
ADD COLUMN scopes jsonb NOT NULL DEFAULT '[]'::jsonb;
