import { eq, asc, inArray } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  agentSessions,
  agentSessionMessages,
  agentSessionEvents,
} from '../../../db/schema';

export interface SessionMessageInfo {
  id: string;
  role: 'user' | 'assistant' | 'system';
  status: 'pending' | 'streaming' | 'complete' | 'error' | 'interrupted' | 'awaiting_approval';
  createdAt: string;
}

export interface SessionEventInfo {
  id: string;
  messageId: string;
  sequence: number;
  type:
    | 'text_delta'
    | 'reasoning_delta'
    | 'tool_call'
    | 'tool_result'
    | 'tool_approval_request'
    | 'error'
    | 'unknown';
  content?: string | null;
  toolCallId?: string | null;
  toolName?: string | null;
  toolArgs?: Record<string, unknown> | null;
  toolResult?: unknown;
  isError?: boolean | null;
  createdAt: string;
  // Approval fields
  approvalId?: string | null;
  approvalStatus?: 'pending' | 'approved' | 'denied' | null;
  approvalDenialReason?: string | null;
  approvedByUserId?: string | null;
  approvedAt?: string | null;
}

export interface SessionMessagesAndEvents {
  messages: SessionMessageInfo[];
  events: SessionEventInfo[];
}

/**
 * Query to get session messages and raw events for local agent processing.
 * Returns minimal message info and raw events without reconstruction.
 */
export class GetSessionMessagesAndEventsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    sessionId: string
  ): Promise<SessionMessagesAndEvents | undefined> {
    // Verify session exists
    const [session] = await this.db
      .select({ id: agentSessions.id })
      .from(agentSessions)
      .where(eq(agentSessions.id, sessionId));

    if (!session) return undefined;

    // Get messages (minimal info)
    const sessionMessages = await this.db
      .select({
        id: agentSessionMessages.id,
        role: agentSessionMessages.role,
        status: agentSessionMessages.status,
        createdAt: agentSessionMessages.createdAt,
      })
      .from(agentSessionMessages)
      .where(eq(agentSessionMessages.sessionId, sessionId))
      .orderBy(asc(agentSessionMessages.createdAt));

    // Get events for all messages
    const messageIds = sessionMessages.map((m) => m.id);
    const events =
      messageIds.length > 0
        ? await this.db
            .select({
              id: agentSessionEvents.id,
              messageId: agentSessionEvents.messageId,
              sequence: agentSessionEvents.sequence,
              type: agentSessionEvents.type,
              content: agentSessionEvents.content,
              toolCallId: agentSessionEvents.toolCallId,
              toolName: agentSessionEvents.toolName,
              toolArgs: agentSessionEvents.toolArgs,
              toolResult: agentSessionEvents.toolResult,
              isError: agentSessionEvents.isError,
              createdAt: agentSessionEvents.createdAt,
              approvalId: agentSessionEvents.approvalId,
              approvalStatus: agentSessionEvents.approvalStatus,
              approvalDenialReason: agentSessionEvents.approvalDenialReason,
              approvedByUserId: agentSessionEvents.approvedByUserId,
              approvedAt: agentSessionEvents.approvedAt,
            })
            .from(agentSessionEvents)
            .where(inArray(agentSessionEvents.messageId, messageIds))
            .orderBy(asc(agentSessionEvents.sequence))
        : [];

    // Convert to serializable format
    const messages: SessionMessageInfo[] = sessionMessages.map((m) => ({
      id: m.id,
      role: m.role,
      status: m.status,
      createdAt: m.createdAt.toISOString(),
    }));

    const serializedEvents: SessionEventInfo[] = events.map((e) => ({
      id: e.id,
      messageId: e.messageId,
      sequence: e.sequence,
      type: e.type,
      content: e.content,
      toolCallId: e.toolCallId,
      toolName: e.toolName,
      toolArgs: e.toolArgs,
      toolResult: e.toolResult,
      isError: e.isError,
      createdAt: e.createdAt.toISOString(),
      approvalId: e.approvalId,
      approvalStatus: e.approvalStatus,
      approvalDenialReason: e.approvalDenialReason,
      approvedByUserId: e.approvedByUserId,
      approvedAt: e.approvedAt?.toISOString() ?? null,
    }));

    return {
      messages,
      events: serializedEvents,
    };
  }
}
