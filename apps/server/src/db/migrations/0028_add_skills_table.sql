-- Create skills table
CREATE TABLE IF NOT EXISTS "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"files" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"user_id" varchar(255),
	"org_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "skills_org_id_key_idx" ON "skills" USING btree ("org_id","key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "skills_is_system_idx" ON "skills" USING btree ("is_system");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "skills_user_id_idx" ON "skills" USING btree ("user_id");
