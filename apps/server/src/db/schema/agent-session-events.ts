import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { agentSessions } from './agent-sessions';
import { agentSessionMessages } from './agent-session-messages';

export type AgentSessionEventType =
  | 'text_delta'
  | 'reasoning_delta'
  | 'tool_call'
  | 'tool_result'
  | 'unknown';

export const agentSessionEvents = pgTable('agent_session_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => agentSessions.id, { onDelete: 'cascade' }),
  messageId: uuid('message_id')
    .notNull()
    .references(() => agentSessionMessages.id, { onDelete: 'cascade' }),
  sequence: integer('sequence').notNull(),
  type: varchar('type', { length: 32 })
    .$type<AgentSessionEventType>()
    .notNull(),

  // Event-specific fields (nullable based on type)
  content: text('content'), // For text_delta, reasoning_delta
  toolCallId: varchar('tool_call_id', { length: 64 }), // For tool_call, tool_result
  toolName: varchar('tool_name', { length: 64 }), // For tool_call
  toolArgs: jsonb('tool_args').$type<Record<string, unknown>>(), // For tool_call
  toolResult: jsonb('tool_result').$type<unknown>(), // For tool_result
  isError: boolean('is_error'), // For tool_result

  // For unknown/unhandled event types
  rawEventType: varchar('raw_event_type', { length: 64 }), // Original event type when we store as 'unknown'
  rawData: jsonb('raw_data').$type<unknown>(), // Raw event data for unknown types

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AgentSessionEvent = typeof agentSessionEvents.$inferSelect;
export type NewAgentSessionEvent = typeof agentSessionEvents.$inferInsert;
