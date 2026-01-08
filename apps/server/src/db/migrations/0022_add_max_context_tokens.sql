-- Add max_context_tokens column to server_agents table
-- NULL means use model's default contextWindow from model-config.ts
ALTER TABLE "server_agents" ADD COLUMN "max_context_tokens" integer;
