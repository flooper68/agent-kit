-- Add indexes on agent key columns for faster permission lookups

CREATE INDEX IF NOT EXISTS "server_agents_key_idx" ON "server_agents" USING btree ("key");
CREATE INDEX IF NOT EXISTS "external_agents_key_idx" ON "external_agents" USING btree ("key");
