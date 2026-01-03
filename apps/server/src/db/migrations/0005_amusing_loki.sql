-- Create artifacts table for storing documents/notes created by agents
CREATE TABLE "artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"org_id" varchar(255) NOT NULL,
	"session_id" uuid,
	"agent_id" varchar(64),
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"format" varchar(32) DEFAULT 'markdown' NOT NULL,
	"summary" text,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "artifacts_org_id_user_id_idx" ON "artifacts" USING btree ("org_id","user_id");--> statement-breakpoint
CREATE INDEX "artifacts_org_id_created_at_idx" ON "artifacts" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "artifacts_agent_id_idx" ON "artifacts" USING btree ("agent_id");