import { eq, asc } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions, agentSessionEvents } from '../../../db/schema';
import type {
  AgentSessionUsage,
  AgentSessionEventType,
} from '../../../db/schema';

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
    title: string | null;
    description: string | null;
    status: string;
    messageCount: number;
    usage: AgentSessionUsage | null;
    createdAt: Date;
    updatedAt: Date;
  };
  events: SessionDetailEvent[];
}

export class GetSessionDetailQuery {
  private db: typeof DbType;
  private agentNames: Map<string, string>;

  constructor(db: typeof DbType, agentNames: Map<string, string>) {
    this.db = db;
    this.agentNames = agentNames;
  }

  async execute(sessionId: string): Promise<SessionDetailData | undefined> {
    // Fetch session
    const sessionResults = await this.db
      .select({
        id: agentSessions.id,
        userId: agentSessions.userId,
        agentId: agentSessions.agentId,
        title: agentSessions.title,
        description: agentSessions.description,
        status: agentSessions.status,
        messageCount: agentSessions.messageCount,
        usage: agentSessions.usage,
        createdAt: agentSessions.createdAt,
        updatedAt: agentSessions.updatedAt,
      })
      .from(agentSessions)
      .where(eq(agentSessions.id, sessionId))
      .limit(1);

    const session = sessionResults[0];
    if (!session) {
      return undefined;
    }

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
      .where(eq(agentSessionEvents.sessionId, sessionId))
      .orderBy(
        asc(agentSessionEvents.createdAt),
        asc(agentSessionEvents.sequence)
      );

    return {
      session: {
        ...session,
        agentName: this.agentNames.get(session.agentId) ?? session.agentId,
      },
      events: eventResults,
    };
  }
}
