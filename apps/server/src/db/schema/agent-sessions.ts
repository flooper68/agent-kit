import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  integer,
  text,
  boolean,
  index,
} from 'drizzle-orm/pg-core';

export type AgentSessionStatus = 'active' | 'completed' | 'cancelled';

/**
 * Token breakdown for context visualization
 */
export interface TokenBreakdown {
  // Input context breakdown (estimated)
  systemPrompt: number; // System prompt tokens
  toolDefinitions: number; // Tool definitions tokens
  conversationHistory: number; // Previous messages tokens (excluding tool results)
  toolResults: number; // Tool result tokens (web search, etc.)
  userInput: number; // Latest user message tokens
  // Output (from provider)
  completion?: number; // Model response tokens
}

/**
 * Session usage metrics - accumulated across all messages
 */
export interface AgentSessionUsage {
  // Token counts (accumulated for billing)
  promptTokens: number; // Total input tokens (accumulated)
  completionTokens: number; // Total output tokens (accumulated)
  totalTokens: number; // promptTokens + completionTokens

  // Cache tokens (accumulated for billing insights)
  cacheReadTokens?: number; // Total tokens read from cache
  cacheWriteTokens?: number; // Total tokens written to cache

  // Current context snapshot (not accumulated - overwritten each message)
  currentContextTokens?: number; // Latest promptTokens from most recent call

  // Token breakdown for current context (snapshot, not accumulated)
  tokenBreakdown?: TokenBreakdown;

  // Cost tracking (in USD, using provider pricing)
  estimatedCost: number;

  // Timing stats (in milliseconds)
  totalLatency: number; // Sum of all message latencies
  averageLatency: number; // Average latency per message

  // Turn counts
  messageCount: number; // Total messages (user + assistant)
  turnCount: number; // Number of user-assistant pairs

  // Model info (last used - sessions may switch models)
  lastModel: string;
  lastProvider: string;
}

export const agentSessions = pgTable(
  'agent_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    orgId: varchar('org_id', { length: 255 }).notNull(),
    agentId: varchar('agent_id', { length: 64 }).notNull(),
    isLocalAgent: boolean('is_local_agent').notNull().default(false),
    title: varchar('title', { length: 255 }),
    description: text('description'),
    status: varchar('status', { length: 32 })
      .$type<AgentSessionStatus>()
      .notNull()
      .default('active'),

    // Spawn hierarchy tracking
    parentSessionId: uuid('parent_session_id'),
    spawnDepth: integer('spawn_depth').notNull().default(0),

    // Usage metrics
    usage: jsonb('usage').$type<AgentSessionUsage>(),

    // Message counters (for quick access without loading all messages)
    messageCount: integer('message_count').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Index for finding child sessions spawned from a parent
    index('idx_agent_sessions_parent_session_id').on(table.parentSessionId),
    // Index for user-scoped session queries
    index('agent_sessions_user_id_idx').on(table.userId),
  ]
);

export type AgentSession = typeof agentSessions.$inferSelect;
export type NewAgentSession = typeof agentSessions.$inferInsert;
