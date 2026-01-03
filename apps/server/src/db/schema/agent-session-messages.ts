import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { agentSessions } from './agent-sessions';

// Message part types (used for reconstructing from events)
export type TextPart = {
  type: 'text';
  content: string;
};

export type ToolInvocationPart = {
  type: 'tool_invocation';
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: 'pending' | 'running' | 'completed' | 'error';
};

export type ToolResultPart = {
  type: 'tool_result';
  toolCallId: string;
  result: unknown;
  isError?: boolean;
};

export type ReasoningPart = {
  type: 'reasoning';
  content: string;
  isCollapsed?: boolean;
  durationSeconds?: number;
};

export type MessagePart =
  | TextPart
  | ToolInvocationPart
  | ToolResultPart
  | ReasoningPart;

export type AgentSessionMessageRole = 'user' | 'assistant' | 'system';

export type AgentSessionMessageMetadata = {
  model?: string;
  tokensUsed?: number;
  latency?: number;
  finishReason?: string;
};

export type AgentSessionMessageStatus =
  | 'pending'
  | 'streaming'
  | 'complete'
  | 'error'
  | 'interrupted';

export const agentSessionMessages = pgTable('agent_session_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => agentSessions.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 16 })
    .$type<AgentSessionMessageRole>()
    .notNull(),
  status: varchar('status', { length: 16 })
    .$type<AgentSessionMessageStatus>()
    .notNull()
    .default('pending'),
  metadata: jsonb('metadata').$type<AgentSessionMessageMetadata>(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AgentSessionMessage = typeof agentSessionMessages.$inferSelect;
export type NewAgentSessionMessage = typeof agentSessionMessages.$inferInsert;
