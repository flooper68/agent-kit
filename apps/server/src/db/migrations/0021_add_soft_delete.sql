-- Migration: Add soft delete support for external_agents and server_agents
-- Deleted agents are hidden from all lists but preserved for auditing/analytics

-- Add deleted_at column to external_agents
ALTER TABLE "external_agents" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint

-- Add deleted_at column to server_agents
ALTER TABLE "server_agents" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint

-- Create indexes for efficient filtering of non-deleted agents
CREATE INDEX "external_agents_deleted_at_idx" ON "external_agents" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "server_agents_deleted_at_idx" ON "server_agents" USING btree ("deleted_at");
