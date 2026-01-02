import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core';
import { agents } from './agents';

export type AgentSessionStatus = 'active' | 'completed' | 'cancelled';

/**
 * Session usage metrics - accumulated across all messages
 */
export interface AgentSessionUsage {
  // Token counts
  promptTokens: number; // Total input tokens
  completionTokens: number; // Total output tokens
  totalTokens: number; // promptTokens + completionTokens

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

export const agentSessions = pgTable('agent_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  agentId: varchar('agent_id', { length: 64 })
    .notNull()
    .references(() => agents.id),
  title: varchar('title', { length: 255 }),
  status: varchar('status', { length: 32 })
    .$type<AgentSessionStatus>()
    .notNull()
    .default('active'),

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
});

export type AgentSession = typeof agentSessions.$inferSelect;
export type NewAgentSession = typeof agentSessions.$inferInsert;
