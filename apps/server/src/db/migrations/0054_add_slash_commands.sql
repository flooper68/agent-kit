-- Create slash_commands table for user-defined prompt shortcuts
CREATE TABLE IF NOT EXISTS "slash_commands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"prompt" text NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"org_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "slash_commands_org_user_key_idx" ON "slash_commands" USING btree ("org_id", "user_id", "key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slash_commands_org_user_idx" ON "slash_commands" USING btree ("org_id", "user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slash_commands_org_created_idx" ON "slash_commands" USING btree ("org_id", "created_at");
