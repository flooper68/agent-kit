import { eq, asc, inArray } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  agentSessions,
  agentSessionMessages,
  agentSessionEvents,
} from '../../../db/schema';
import type { AgentSessionEvent } from '../../../db/schema/agent-session-events';
import type { SessionWithMessages } from '../types';
import { reconstructPartsFromEvents } from '../utils';

export class GetSessionWithMessagesQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(sessionId: string): Promise<SessionWithMessages | undefined> {
    const [session] = await this.db
      .select()
      .from(agentSessions)
      .where(eq(agentSessions.id, sessionId));

    if (!session) return undefined;

    // Get messages
    const sessionMessages = await this.db
      .select()
      .from(agentSessionMessages)
      .where(eq(agentSessionMessages.sessionId, sessionId))
      .orderBy(asc(agentSessionMessages.createdAt));

    // Get events for messages
    const messageIds = sessionMessages.map((m) => m.id);
    const events =
      messageIds.length > 0
        ? await this.db
            .select()
            .from(agentSessionEvents)
            .where(inArray(agentSessionEvents.messageId, messageIds))
            .orderBy(asc(agentSessionEvents.sequence))
        : [];

    // Group events by message
    const eventsByMessage = new Map<string, AgentSessionEvent[]>();
    for (const event of events) {
      const messageEvents = eventsByMessage.get(event.messageId) || [];
      messageEvents.push(event);
      eventsByMessage.set(event.messageId, messageEvents);
    }

    // Reconstruct messages with parts
    const messagesWithParts = sessionMessages.map((m) => ({
      ...m,
      parts: reconstructPartsFromEvents(eventsByMessage.get(m.id) || []),
    }));

    return {
      ...session,
      messages: messagesWithParts,
    };
  }
}
