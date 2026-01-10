-- Junction table for server agents' allowed skills
-- Defines which skills a server agent can access
CREATE TABLE IF NOT EXISTS "server_agent_allowed_skills" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "server_agent_id" uuid NOT NULL REFERENCES "server_agents"("id") ON DELETE CASCADE,
  "skill_id" uuid NOT NULL REFERENCES "skills"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "server_skill_unique" UNIQUE ("server_agent_id", "skill_id")
);

-- Junction table for external agents' allowed skills
-- Defines which skills an external agent can access
CREATE TABLE IF NOT EXISTS "external_agent_allowed_skills" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "external_agent_id" uuid NOT NULL REFERENCES "external_agents"("id") ON DELETE CASCADE,
  "skill_id" uuid NOT NULL REFERENCES "skills"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "external_skill_unique" UNIQUE ("external_agent_id", "skill_id")
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS "idx_server_allowed_skills_agent" ON "server_agent_allowed_skills"("server_agent_id");
CREATE INDEX IF NOT EXISTS "idx_server_allowed_skills_skill" ON "server_agent_allowed_skills"("skill_id");
CREATE INDEX IF NOT EXISTS "idx_external_allowed_skills_agent" ON "external_agent_allowed_skills"("external_agent_id");
CREATE INDEX IF NOT EXISTS "idx_external_allowed_skills_skill" ON "external_agent_allowed_skills"("skill_id");
