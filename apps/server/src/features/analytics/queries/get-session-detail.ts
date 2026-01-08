import { eq, and, asc } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  agentSessions,
  agentSessionEvents,
  agentSessionMessages,
  externalAgents,
  serverAgents,
} from '../../../db/schema';
import type {
  AgentSessionUsage,
  AgentSessionEventType,
  AgentSessionMessageMetadata,
  AgentSessionMessageRole,
  AgentSessionMessageStatus,
} from '../../../db/schema';

export interface GetSessionDetailInput {
  sessionId: string;
  orgId: string;
}

export interface SessionDetailMessage {
  id: string;
  role: AgentSessionMessageRole;
  status: AgentSessionMessageStatus;
  metadata: AgentSessionMessageMetadata | null;
  createdAt: Date;
}

export interface SessionDetailEvent {
  id: string;
  messageId: string;
  sequence: number;
  type: AgentSessionEventType;
  createdAt: Date;
  // Type-specific fields
  content: string | null;
  toolCallId: string | null;
  toolName: string | null;
  toolArgs: Record<string, unknown> | null;
  toolResult: unknown;
  isError: boolean | null;
  errorCode: string | null;
  errorMessage: string | null;
  errorRetryable: boolean | null;
  errorDetails: Record<string, unknown> | null;
  rawEventType: string | null;
  rawData: unknown;
}

export interface SessionDetailData {
  session: {
    id: string;
    userId: string;
    agentId: string;
    agentName: string;
    isLocalAgent: boolean;
    title: string | null;
    description: string | null;
    status: string;
    messageCount: number;
    usage: AgentSessionUsage | null;
    createdAt: Date;
    updatedAt: Date;
    parentSessionId: string | null;
    spawnDepth: number;
  };
  messages: SessionDetailMessage[];
  events: SessionDetailEvent[];
}

export type GetSessionDetailResult = SessionDetailData | undefined;

export class GetSessionDetailQuery {
  private db: typeof DbType;
  private agentNames: Map<string, string>;

  constructor(db: typeof DbType, agentNames: Map<string, string>) {
    this.db = db;
    this.agentNames = agentNames;
  }

  async execute(input: GetSessionDetailInput): Promise<GetSessionDetailResult> {
    // Fetch session - filter by both sessionId and orgId for security
    const sessionResults = await this.db
      .select({
        id: agentSessions.id,
        userId: agentSessions.userId,
        agentId: agentSessions.agentId,
        isLocalAgent: agentSessions.isLocalAgent,
        title: agentSessions.title,
        description: agentSessions.description,
        status: agentSessions.status,
        messageCount: agentSessions.messageCount,
        usage: agentSessions.usage,
        createdAt: agentSessions.createdAt,
        updatedAt: agentSessions.updatedAt,
        parentSessionId: agentSessions.parentSessionId,
        spawnDepth: agentSessions.spawnDepth,
      })
      .from(agentSessions)
      .where(
        and(
          eq(agentSessions.id, input.sessionId),
          eq(agentSessions.orgId, input.orgId)
        )
      )
      .limit(1);

    const session = sessionResults[0];
    if (!session) {
      return undefined;
    }

    // Fetch all messages for this session
    const messageResults = await this.db
      .select({
        id: agentSessionMessages.id,
        role: agentSessionMessages.role,
        status: agentSessionMessages.status,
        metadata: agentSessionMessages.metadata,
        createdAt: agentSessionMessages.createdAt,
      })
      .from(agentSessionMessages)
      .where(eq(agentSessionMessages.sessionId, input.sessionId))
      .orderBy(asc(agentSessionMessages.createdAt));

    // Fetch all events for this session, ordered by sequence
    const eventResults = await this.db
      .select({
        id: agentSessionEvents.id,
        messageId: agentSessionEvents.messageId,
        sequence: agentSessionEvents.sequence,
        type: agentSessionEvents.type,
        createdAt: agentSessionEvents.createdAt,
        content: agentSessionEvents.content,
        toolCallId: agentSessionEvents.toolCallId,
        toolName: agentSessionEvents.toolName,
        toolArgs: agentSessionEvents.toolArgs,
        toolResult: agentSessionEvents.toolResult,
        isError: agentSessionEvents.isError,
        errorCode: agentSessionEvents.errorCode,
        errorMessage: agentSessionEvents.errorMessage,
        errorRetryable: agentSessionEvents.errorRetryable,
        errorDetails: agentSessionEvents.errorDetails,
        rawEventType: agentSessionEvents.rawEventType,
        rawData: agentSessionEvents.rawData,
      })
      .from(agentSessionEvents)
      .where(eq(agentSessionEvents.sessionId, input.sessionId))
      .orderBy(
        asc(agentSessionEvents.createdAt),
        asc(agentSessionEvents.sequence)
      );

    // Resolve agent name from custom agents
    let agentName = this.agentNames.get(session.agentId);
    if (!agentName) {
      // Look up agent name by key
      // Check external agents first
      const externalResult = await this.db
        .select({ name: externalAgents.name })
        .from(externalAgents)
        .where(eq(externalAgents.key, session.agentId))
        .limit(1);

      if (externalResult[0]) {
        agentName = externalResult[0].name;
      } else {
        // Check server agents
        const serverResult = await this.db
          .select({ name: serverAgents.name })
          .from(serverAgents)
          .where(eq(serverAgents.key, session.agentId))
          .limit(1);
        agentName = serverResult[0]?.name ?? session.agentId;
      }
    }

    return {
      session: {
        ...session,
        agentName,
        isLocalAgent: session.isLocalAgent,
      },
      messages: messageResults,
      events: eventResults,
    };
  }
}
