import { eq, asc } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  agentSessionMessages,
  agentSessionEvents,
  type MessagePart,
} from '../../../db/schema';
import type { AgentSessionEvent } from '../../../db/schema/agent-session-events';
import { reconstructPartsFromEvents, buildApprovalRequestMap } from '../utils';

export interface GetMessagesBySessionIdInput {
  sessionId: string;
}

export interface MessageWithParts {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: MessagePart[];
}

export type GetMessagesBySessionIdResult = MessageWithParts[];

export class GetMessagesBySessionIdQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: GetMessagesBySessionIdInput
  ): Promise<GetMessagesBySessionIdResult> {
    const { sessionId } = input;
    // Get all messages for the session
    const sessionMessages = await this.db
      .select()
      .from(agentSessionMessages)
      .where(eq(agentSessionMessages.sessionId, sessionId))
      .orderBy(asc(agentSessionMessages.createdAt));

    // Get all events for these messages
    const events =
      sessionMessages.length > 0
        ? await this.db
            .select()
            .from(agentSessionEvents)
            .where(eq(agentSessionEvents.sessionId, sessionId))
            .orderBy(asc(agentSessionEvents.sequence))
        : [];

    // Group events by message ID
    const eventsByMessage = new Map<string, AgentSessionEvent[]>();
    for (const event of events) {
      const messageEvents = eventsByMessage.get(event.messageId) || [];
      messageEvents.push(event);
      eventsByMessage.set(event.messageId, messageEvents);
    }

    // Build session-wide approval map for cross-message lookups
    // This allows tool_call events to find approval info from earlier messages
    const sessionApprovalMap = buildApprovalRequestMap(events);

    // Reconstruct parts from events
    return sessionMessages.map((m) => ({
      id: m.id,
      role: m.role,
      parts: reconstructPartsFromEvents(eventsByMessage.get(m.id) || [], sessionApprovalMap),
    }));
  }
}
