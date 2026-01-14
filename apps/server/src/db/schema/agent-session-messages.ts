/**
 * Agent Session Messages Schema
 *
 * Messages are containers that track the lifecycle and metadata of each
 * turn in the conversation. They do NOT store content directly.
 *
 * Architecture (Event Sourcing Pattern):
 * - Session (1) → Messages (many) → Events (many)
 * - Messages track: status, role, token usage, latency, model info
 * - Events track: actual content (text deltas, tool calls, results)
 * - Content is reconstructed from events via reconstructPartsFromEvents()
 *
 * Why separate tables:
 * - Messages: mutable status/metadata, quick status lookups
 * - Events: immutable write-once records, streaming inserts, audit log
 */
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
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
  state: 'pending' | 'running' | 'completed' | 'error' | 'pending_approval';
  // Approval fields (for tools that required approval)
  approvalStatus?: 'pending' | 'approved' | 'denied';
  approvalDenialReason?: string;
  approvedByUserId?: string;
  approvedAt?: string; // ISO string
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

/**
 * Per-message token breakdown for context visualization
 */
export type ContextBreakdown = {
  systemPrompt: number;
  toolDefinitions: number;
  conversationHistory: number;
  userInput: number;
};

export type AgentSessionMessageMetadata = {
  model?: string;
  tokensUsed?: number;
  latency?: number;
  finishReason?: string;
  // Context tracking per-message
  contextTokens?: number; // promptTokens for this call (= current context size)
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  // Detailed context breakdown for this message
  contextBreakdown?: ContextBreakdown;
};

export type AgentSessionMessageStatus =
  | 'pending'
  | 'streaming'
  | 'complete'
  | 'error'
  | 'interrupted'
  | 'awaiting_approval';

export const agentSessionMessages = pgTable(
  'agent_session_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => agentSessions.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 16 })
      .$type<AgentSessionMessageRole>()
      .notNull(),
    status: varchar('status', { length: 32 })
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
  },
  (table) => [
    // Index for fetching messages by session
    index('agent_session_messages_session_id_idx').on(table.sessionId),
  ]
);

export type AgentSessionMessage = typeof agentSessionMessages.$inferSelect;
export type NewAgentSessionMessage = typeof agentSessionMessages.$inferInsert;
