-- Add allowedTools column to external_agents table
-- Stores array of tool IDs the external agent is permitted to use
-- Empty array (default) means no tools are allowed (secure by default)
ALTER TABLE "external_agents"
ADD COLUMN IF NOT EXISTS "allowed_tools" jsonb DEFAULT '[]'::jsonb NOT NULL;
