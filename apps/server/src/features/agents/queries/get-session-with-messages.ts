import { eq, asc, inArray } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  agentSessions,
  agentSessionMessages,
  agentSessionEvents,
  externalAgents,
  serverAgents,
  type AgentSession,
  type AgentSessionMessage,
  type MessagePart,
} from '../../../db/schema';
import type { AgentSessionEvent } from '../../../db/schema/agent-session-events';
import { reconstructPartsFromEvents, buildApprovalRequestMap } from '../utils';
import { logger } from '../../../agent/logger';
import { getModelInfo } from '../../../agent/model-config';

export interface GetSessionWithMessagesInput {
  sessionId: string;
}

export interface SessionWithMessages extends AgentSession {
  messages: Array<AgentSessionMessage & { parts: MessagePart[] }>;
  /** Resolved agent name (for display). For local agents, this is the full name, not the key. */
  agentName?: string;
  /** Max context tokens for the agent (from agent config or model default) */
  maxContextTokens?: number;
}

export type GetSessionWithMessagesResult = SessionWithMessages | undefined;

const log = logger.child({ module: 'get-session-with-messages' });

export class GetSessionWithMessagesQuery {
  private db: typeof DbType;
  private agentNames: Map<string, string>;

  constructor(db: typeof DbType, agentNames: Map<string, string>) {
    this.db = db;
    this.agentNames = agentNames;
  }

  async execute(
    input: GetSessionWithMessagesInput
  ): Promise<GetSessionWithMessagesResult> {
    const { sessionId } = input;
    const [session] = await this.db
      .select()
      .from(agentSessions)
      .where(eq(agentSessions.id, sessionId));

    if (!session) return undefined;

    // Resolve agent name and max context - check built-in agents first, then custom agents
    let agentName = this.agentNames.get(session.agentId);
    let maxContextTokens: number | undefined;

    if (!agentName && session.isLocalAgent) {
      // Look up custom agent name by key - check external agents first
      const externalResult = await this.db
        .select({ name: externalAgents.name })
        .from(externalAgents)
        .where(eq(externalAgents.key, session.agentId))
        .limit(1);

      if (externalResult[0]) {
        agentName = externalResult[0].name;
        // External agents don't have maxContextTokens config
      } else {
        // Check server agents - get model and maxContextTokens
        const serverResult = await this.db
          .select({
            name: serverAgents.name,
            model: serverAgents.model,
            maxContextTokens: serverAgents.maxContextTokens,
          })
          .from(serverAgents)
          .where(eq(serverAgents.key, session.agentId))
          .limit(1);

        if (serverResult[0]) {
          agentName = serverResult[0].name;
          // Use agent's maxContextTokens if set, otherwise use model's default
          if (serverResult[0].maxContextTokens) {
            maxContextTokens = serverResult[0].maxContextTokens;
          } else {
            const modelInfo = getModelInfo(serverResult[0].model);
            maxContextTokens = modelInfo?.contextWindow;
          }
        }
      }

      if (!agentName) {
        log.warn(
          'Custom agent not found for session, using agentId as fallback',
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

    // Build session-wide approval map for cross-message lookups
    // This allows tool_call events to find approval info from earlier messages
    const sessionApprovalMap = buildApprovalRequestMap(events);

    // Reconstruct messages with parts
    const messagesWithParts = sessionMessages.map((m) => ({
      ...m,
      parts: reconstructPartsFromEvents(
        eventsByMessage.get(m.id) || [],
        sessionApprovalMap
      ),
    }));

    return {
      ...session,
      agentName,
      maxContextTokens,
      messages: messagesWithParts,
    };
  }
}
