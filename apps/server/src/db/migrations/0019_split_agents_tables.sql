-- Migration: Split agents table into external_agents and server_agents
-- External agents are WebSocket-based and need authentication
-- Server agents are LLM agents that run on the server

-- Step 1: Create external_agents table
CREATE TABLE IF NOT EXISTS "external_agents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar(255) NOT NULL,
  "key" varchar(64) NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "secret_key" varchar(255) NOT NULL UNIQUE,
  "secret_key_prefix" varchar(32) NOT NULL UNIQUE,
  "disabled" boolean DEFAULT false NOT NULL,
  "is_favorite" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Step 2: Create server_agents table
CREATE TABLE IF NOT EXISTS "server_agents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar(255) NOT NULL,
  "key" varchar(64) NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "provider" varchar(64) DEFAULT 'anthropic' NOT NULL,
  "model" varchar(128) DEFAULT 'claude-sonnet-4-5-20250929' NOT NULL,
  "system_prompt" text DEFAULT 'You are a helpful AI assistant.' NOT NULL,
  "tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "temperature" real,
  "max_output_tokens" integer,
  "thinking_config" jsonb,
  "can_spawn_subagents" boolean DEFAULT true NOT NULL,
  "allowed_subagents" jsonb,
  "disabled" boolean DEFAULT false NOT NULL,
  "is_favorite" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Step 3: Create indexes for external_agents
CREATE INDEX "external_agents_user_id_idx" ON "external_agents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "external_agents_secret_key_idx" ON "external_agents" USING btree ("secret_key");--> statement-breakpoint
CREATE UNIQUE INDEX "external_agents_user_key_idx" ON "external_agents" USING btree ("user_id", "key");--> statement-breakpoint

-- Step 4: Create indexes for server_agents
CREATE INDEX "server_agents_user_id_idx" ON "server_agents" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "server_agents_user_key_idx" ON "server_agents" USING btree ("user_id", "key");--> statement-breakpoint

-- Step 5: Migrate external agents (is_external = true)
INSERT INTO "external_agents" (
  "id", "user_id", "key", "name", "description",
  "secret_key", "secret_key_prefix",
  "disabled", "is_favorite", "created_at", "updated_at"
)
SELECT
  "id", "user_id", "key", "name", "description",
  "secret_key", "secret_key_prefix",
  "disabled", "is_favorite", "created_at", "updated_at"
FROM "agents"
WHERE "is_external" = true;--> statement-breakpoint

-- Step 6: Migrate server agents (is_external = false)
INSERT INTO "server_agents" (
  "id", "user_id", "key", "name", "description",
  "provider", "model", "system_prompt", "tools",
  "temperature", "max_output_tokens", "thinking_config",
  "can_spawn_subagents", "allowed_subagents",
  "disabled", "is_favorite", "created_at", "updated_at"
)
SELECT
  "id", "user_id", "key", "name", "description",
  "provider", "model", "system_prompt", "tools",
  "temperature", "max_output_tokens", "thinking_config",
  "can_spawn_subagents", "allowed_subagents",
  "disabled", "is_favorite", "created_at", "updated_at"
FROM "agents"
WHERE "is_external" = false;--> statement-breakpoint

-- Step 7: Drop old agents table indexes
DROP INDEX IF EXISTS "agents_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "agents_secret_key_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "agents_user_key_idx";--> statement-breakpoint

-- Step 8: Drop old agents table
DROP TABLE IF EXISTS "agents";
