-- Agents table (static configuration)
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

-- Agent sessions table
CREATE TABLE "agent_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar(255) NOT NULL,
  "agent_id" varchar(64) NOT NULL,
  "title" varchar(255),
  "status" varchar(32) DEFAULT 'active' NOT NULL,
  "usage" jsonb,
  "message_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "agent_sessions_agent_id_agents_id_fk"
    FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action
);

-- Agent session messages table
CREATE TABLE "agent_session_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL,
  "role" varchar(16) NOT NULL,
  "status" varchar(32) DEFAULT 'pending' NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "agent_session_messages_session_id_agent_sessions_id_fk"
    FOREIGN KEY ("session_id") REFERENCES "public"."agent_sessions"("id") ON DELETE cascade ON UPDATE no action
);

-- Agent session events table (event sourcing for message content)
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
  "raw_event_type" varchar(64),
  "raw_data" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "agent_session_events_session_id_agent_sessions_id_fk"
    FOREIGN KEY ("session_id") REFERENCES "public"."agent_sessions"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "agent_session_events_message_id_agent_session_messages_id_fk"
    FOREIGN KEY ("message_id") REFERENCES "public"."agent_session_messages"("id") ON DELETE cascade ON UPDATE no action
);

-- Indexes for efficient lookups
CREATE INDEX "idx_agent_session_events_message_id" ON "agent_session_events" ("message_id");
CREATE INDEX "idx_agent_session_events_session_id" ON "agent_session_events" ("session_id");
