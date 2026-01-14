-- User activity sessions table for tracking user presence/activity periods
CREATE TABLE user_activity_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  org_id VARCHAR(255) NOT NULL,

  -- Session timing
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,

  -- Aggregated metrics from agent sessions during this activity session
  estimated_cost NUMERIC DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  agent_sessions_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for finding user's active/recent sessions
CREATE INDEX idx_user_activity_sessions_user_org ON user_activity_sessions(user_id, org_id);

-- Index for org-wide analytics queries (ordered by start time)
CREATE INDEX idx_user_activity_sessions_org_started ON user_activity_sessions(org_id, started_at DESC);

-- Index for finding user's most recent activity (for heartbeat check)
CREATE INDEX idx_user_activity_sessions_last_activity ON user_activity_sessions(user_id, org_id, last_activity_at DESC);
