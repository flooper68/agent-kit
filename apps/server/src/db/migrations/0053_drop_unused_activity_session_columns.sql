-- Drop unused columns from user_activity_sessions
-- These columns were never populated (always defaulted to 0) and are not needed
ALTER TABLE "user_activity_sessions" DROP COLUMN IF EXISTS "estimated_cost";
ALTER TABLE "user_activity_sessions" DROP COLUMN IF EXISTS "total_tokens";
ALTER TABLE "user_activity_sessions" DROP COLUMN IF EXISTS "agent_sessions_count";
