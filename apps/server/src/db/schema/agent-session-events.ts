/**
 * Agent Session Events Schema
 *
 * Events are the granular, streaming units that make up message content.
 * Each event is immutable and ordered by sequence number within a session.
 *
 * Event Types:
 * - text_delta: Incremental text content from the model
 * - reasoning_delta: Model's reasoning/thinking content
 * - tool_call: Tool invocation with name and arguments
 * - tool_result: Result returned from a tool execution
 * - error: Error that occurred during processing
 * - unknown: Unhandled event types (stored for debugging)
 *
 * Tool calls may require approval before execution. When approval is
 * needed, the approvalStatus/approvalScopes columns track the state.
 * For nested executeCommand calls, innerToolName/innerToolArgs store
 * what's actually being executed.
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { agentSessions } from './agent-sessions';
import { agentSessionMessages } from './agent-session-messages';

export type AgentSessionEventType =
  | 'text_delta'
  | 'reasoning_delta'
  | 'tool_call'
  | 'tool_result'
  | 'tool_approval_request'
  | 'error'
  | 'unknown';

export type ApprovalStatus = 'pending' | 'approved' | 'denied';

export const agentSessionEvents = pgTable(
  'agent_session_events',
  {
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

    // AI SDK approval flow fields (for tool_approval_request events)
    approvalId: varchar('approval_id', { length: 64 }), // AI SDK's approval ID for needsApproval flow

    // Provider-specific metadata (e.g., Gemini thought_signature for tool calls)
    providerMetadata:
      jsonb('provider_metadata').$type<Record<string, unknown>>(),

    // Legacy approval fields (for backwards compatibility, will be removed)
    approvalStatus: varchar('approval_status', {
      length: 16,
    }).$type<ApprovalStatus>(),
    approvalScopes: text('approval_scopes').array(),
    approvalDenialReason: text('approval_denial_reason'),

    // Approval tracking: who approved and when
    approvedByUserId: varchar('approved_by_user_id', { length: 64 }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),

    // For nested calls via executeCommand: the inner tool being executed
    // When executeCommand calls an approval-required tool, we store what's actually being run
    innerToolName: varchar('inner_tool_name', { length: 64 }),
    innerToolArgs: jsonb('inner_tool_args').$type<Record<string, unknown>>(),
    isError: boolean('is_error'), // For tool_result

    // Error event fields
    errorCode: varchar('error_code', { length: 32 }), // For error events (e.g., 'PROVIDER_ERROR', 'RATE_LIMIT')
    errorMessage: text('error_message'), // For error events
    errorRetryable: boolean('error_retryable'), // For error events
    errorDetails: jsonb('error_details').$type<Record<string, unknown>>(), // For error events

    // For unknown/unhandled event types
    rawEventType: varchar('raw_event_type', { length: 64 }), // Original event type when we store as 'unknown'
    rawData: jsonb('raw_data').$type<unknown>(), // Raw event data for unknown types

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Index for fetching events by session
    index('agent_session_events_session_id_idx').on(table.sessionId),
    // Index for fetching events by message
    index('agent_session_events_message_id_idx').on(table.messageId),
    // Composite index for ordered event retrieval within a session
    index('agent_session_events_session_sequence_idx').on(
      table.sessionId,
      table.sequence
    ),
  ]
);

export type AgentSessionEvent = typeof agentSessionEvents.$inferSelect;
export type NewAgentSessionEvent = typeof agentSessionEvents.$inferInsert;
