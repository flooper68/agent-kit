CREATE TABLE "agents" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"system_prompt" text NOT NULL,
	"provider" varchar(64) DEFAULT 'openai' NOT NULL,
	"model" varchar(64) DEFAULT 'gpt-5-mini' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"agent_id" varchar(64) NOT NULL,
	"title" varchar(255),
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"usage" jsonb,
	"message_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_session_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" varchar(16) NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_session_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"type" varchar(32) NOT NULL,
	"content" text,
	"tool_call_id" varchar(64),
	"tool_name" varchar(64),
	"tool_args" jsonb,
	"tool_result" jsonb,
	"is_error" boolean,
	"error_code" varchar(32),
	"error_message" text,
	"error_retryable" boolean,
	"error_details" jsonb,
	"raw_event_type" varchar(64),
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_session_messages" ADD CONSTRAINT "agent_session_messages_session_id_agent_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."agent_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_session_events" ADD CONSTRAINT "agent_session_events_session_id_agent_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."agent_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_session_events" ADD CONSTRAINT "agent_session_events_message_id_agent_session_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."agent_session_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Seed default agents
INSERT INTO "agents" ("id", "name", "description", "system_prompt", "provider", "model") VALUES (
  'general-assistant',
  'General Assistant',
  'A helpful AI assistant for general tasks',
  'You are a helpful AI assistant. Be concise, accurate, and helpful.

When using tools:
- Use the getTime tool when asked about the current date or time
- Explain what you are doing when using tools

Be friendly but professional.',
  'openai',
  'gpt-4o'
) ON CONFLICT (id) DO NOTHING;