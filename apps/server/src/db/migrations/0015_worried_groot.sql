ALTER TABLE "local_agents" ADD COLUMN "provider" varchar(64) DEFAULT 'anthropic' NOT NULL;--> statement-breakpoint
ALTER TABLE "local_agents" ADD COLUMN "model" varchar(128) DEFAULT 'claude-sonnet-4-5-20250929' NOT NULL;--> statement-breakpoint
ALTER TABLE "local_agents" ADD COLUMN "system_prompt" text DEFAULT 'You are a helpful AI assistant.' NOT NULL;--> statement-breakpoint
ALTER TABLE "local_agents" ADD COLUMN "tools" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "local_agents" ADD COLUMN "temperature" real;--> statement-breakpoint
ALTER TABLE "local_agents" ADD COLUMN "max_output_tokens" integer;--> statement-breakpoint
ALTER TABLE "local_agents" ADD COLUMN "thinking_config" jsonb;--> statement-breakpoint
ALTER TABLE "local_agents" ADD COLUMN "can_spawn_subagents" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "local_agents" ADD COLUMN "allowed_subagents" jsonb;--> statement-breakpoint
ALTER TABLE "local_agents" ADD COLUMN "is_favorite" boolean DEFAULT false NOT NULL;