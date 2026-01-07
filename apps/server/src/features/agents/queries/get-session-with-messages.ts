import { eq, asc, inArray } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  agentSessions,
  agentSessionMessages,
  agentSessionEvents,
  localAgents,
} from '../../../db/schema';
import type { AgentSessionEvent } from '../../../db/schema/agent-session-events';
import type { SessionWithMessages } from '../types';
import { reconstructPartsFromEvents } from '../utils';
import { logger } from '../../../agent/logger';

const log = logger.child({ module: 'get-session-with-messages' });

export class GetSessionWithMessagesQuery {
  private db: typeof DbType;
  private agentNames: Map<string, string>;

  constructor(db: typeof DbType, agentNames: Map<string, string>) {
    this.db = db;
    this.agentNames = agentNames;
  }

  async execute(sessionId: string): Promise<SessionWithMessages | undefined> {
    const [session] = await this.db
      .select()
      .from(agentSessions)
      .where(eq(agentSessions.id, sessionId));

    if (!session) return undefined;

    // Resolve agent name - check built-in agents first, then local agents
    let agentName = this.agentNames.get(session.agentId);
    if (!agentName && session.isLocalAgent) {
      // Look up local agent name by key
      const localAgentResult = await this.db
        .select({ name: localAgents.name })
        .from(localAgents)
        .where(eq(localAgents.key, session.agentId))
        .limit(1);
      agentName = localAgentResult[0]?.name;

      if (!agentName) {
        log.warn(
          'Local agent not found for session, using agentId as fallback',
          {
            sessionId,
            agentId: session.agentId,
            isLocalAgent: session.isLocalAgent,
          }
        );
      }
    } else if (!agentName && !session.isLocalAgent) {
      log.warn(
        'Built-in agent not found for session, using agentId as fallback',
        {
          sessionId,
          agentId: session.agentId,
        }
      );
    }
    // Fall back to agentId if no name found
    agentName = agentName ?? session.agentId;

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
      agentName,
      messages: messagesWithParts,
    };
  }
}
