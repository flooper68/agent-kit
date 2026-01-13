-- Add approval columns for AI SDK needsApproval flow
ALTER TABLE "agent_session_events" ADD COLUMN "approval_id" varchar(64);

-- Legacy approval columns (for backwards compatibility, may be removed later)
ALTER TABLE "agent_session_events" ADD COLUMN "approval_status" varchar(16);
ALTER TABLE "agent_session_events" ADD COLUMN "approval_scopes" text[];
ALTER TABLE "agent_session_events" ADD COLUMN "approval_denial_reason" text;

-- For nested executeCommand calls: store the inner tool info
ALTER TABLE "agent_session_events" ADD COLUMN "inner_tool_name" varchar(64);
ALTER TABLE "agent_session_events" ADD COLUMN "inner_tool_args" jsonb;
