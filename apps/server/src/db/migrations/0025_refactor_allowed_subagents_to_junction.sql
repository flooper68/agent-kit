-- Refactor allowed_subagents from JSONB to proper junction tables with foreign keys
-- This provides referential integrity and cascade deletes

-- Junction table for server agents' allowed subagents
CREATE TABLE IF NOT EXISTS "server_agent_allowed_subagents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "server_agent_id" uuid NOT NULL REFERENCES "server_agents"("id") ON DELETE CASCADE,
  -- The allowed agent can be either a server agent or external agent
  "allowed_server_agent_id" uuid REFERENCES "server_agents"("id") ON DELETE CASCADE,
  "allowed_external_agent_id" uuid REFERENCES "external_agents"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  -- Ensure exactly one allowed agent type is set
  CONSTRAINT "server_allowed_one_target" CHECK (
    (allowed_server_agent_id IS NOT NULL AND allowed_external_agent_id IS NULL) OR
    (allowed_server_agent_id IS NULL AND allowed_external_agent_id IS NOT NULL)
  ),
  -- Unique constraint to prevent duplicates
  CONSTRAINT "server_allowed_unique_server" UNIQUE ("server_agent_id", "allowed_server_agent_id"),
  CONSTRAINT "server_allowed_unique_external" UNIQUE ("server_agent_id", "allowed_external_agent_id")
);

-- Junction table for external agents' allowed subagents
CREATE TABLE IF NOT EXISTS "external_agent_allowed_subagents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "external_agent_id" uuid NOT NULL REFERENCES "external_agents"("id") ON DELETE CASCADE,
  -- The allowed agent can be either a server agent or external agent
  "allowed_server_agent_id" uuid REFERENCES "server_agents"("id") ON DELETE CASCADE,
  "allowed_external_agent_id" uuid REFERENCES "external_agents"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  -- Ensure exactly one allowed agent type is set
  CONSTRAINT "external_allowed_one_target" CHECK (
    (allowed_server_agent_id IS NOT NULL AND allowed_external_agent_id IS NULL) OR
    (allowed_server_agent_id IS NULL AND allowed_external_agent_id IS NOT NULL)
  ),
  -- Unique constraint to prevent duplicates
  CONSTRAINT "external_allowed_unique_server" UNIQUE ("external_agent_id", "allowed_server_agent_id"),
  CONSTRAINT "external_allowed_unique_external" UNIQUE ("external_agent_id", "allowed_external_agent_id")
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS "idx_server_allowed_server_agent" ON "server_agent_allowed_subagents"("server_agent_id");
CREATE INDEX IF NOT EXISTS "idx_server_allowed_target_server" ON "server_agent_allowed_subagents"("allowed_server_agent_id") WHERE "allowed_server_agent_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_server_allowed_target_external" ON "server_agent_allowed_subagents"("allowed_external_agent_id") WHERE "allowed_external_agent_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_external_allowed_external_agent" ON "external_agent_allowed_subagents"("external_agent_id");
CREATE INDEX IF NOT EXISTS "idx_external_allowed_target_server" ON "external_agent_allowed_subagents"("allowed_server_agent_id") WHERE "allowed_server_agent_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_external_allowed_target_external" ON "external_agent_allowed_subagents"("allowed_external_agent_id") WHERE "allowed_external_agent_id" IS NOT NULL;

-- Drop the old JSONB columns
ALTER TABLE "server_agents" DROP COLUMN IF EXISTS "allowed_subagents";
ALTER TABLE "external_agents" DROP COLUMN IF EXISTS "allowed_subagents";
