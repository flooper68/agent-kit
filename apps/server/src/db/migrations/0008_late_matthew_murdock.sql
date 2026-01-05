CREATE TABLE "local_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"system_prompt" text NOT NULL,
	"provider" varchar(64) DEFAULT 'openai' NOT NULL,
	"model" varchar(64) DEFAULT 'gpt-5-mini' NOT NULL,
	"tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"secret_key" varchar(255) NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "local_agents_secret_key_unique" UNIQUE("secret_key")
);
--> statement-breakpoint
ALTER TABLE "agent_sessions" DROP CONSTRAINT "agent_sessions_agent_id_agents_id_fk";
--> statement-breakpoint
ALTER TABLE "agent_sessions" ADD COLUMN "is_local_agent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "local_agents_user_id_idx" ON "local_agents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "local_agents_secret_key_idx" ON "local_agents" USING btree ("secret_key");