import { sql, eq, and, gte, count } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions, agentSessionEvents } from '../../../db/schema';
import type { TimeRange } from '../types';
import { getStartDate } from './utils';

// ========================================
// Session Length Distribution Query
// ========================================

export interface GetSessionLengthDistributionInput {
  orgId: string;
  timeRange: TimeRange;
  userId?: string;
}

export interface SessionLengthBucket {
  bucket: string;
  sessionCount: number;
}

export type GetSessionLengthDistributionResult = SessionLengthBucket[];

export class GetSessionLengthDistributionQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: GetSessionLengthDistributionInput
  ): Promise<GetSessionLengthDistributionResult> {
    const startDate = getStartDate(input.timeRange);

    const conditions = [eq(agentSessions.orgId, input.orgId)];
    if (startDate) {
      conditions.push(gte(agentSessions.createdAt, startDate));
    }
    if (input.userId) {
      conditions.push(eq(agentSessions.userId, input.userId));
    }

    const result = await this.db
      .select({
        bucket: sql<string>`
          CASE
            WHEN ${agentSessions.messageCount} IS NULL OR ${agentSessions.messageCount} = 0 THEN '0'
            WHEN ${agentSessions.messageCount} BETWEEN 1 AND 5 THEN '1-5'
            WHEN ${agentSessions.messageCount} BETWEEN 6 AND 10 THEN '6-10'
            WHEN ${agentSessions.messageCount} BETWEEN 11 AND 20 THEN '11-20'
            WHEN ${agentSessions.messageCount} BETWEEN 21 AND 50 THEN '21-50'
            ELSE '50+'
          END
        `,
        sessionCount: count(),
      })
      .from(agentSessions)
      .where(and(...conditions))
      .groupBy(
        sql`CASE
          WHEN ${agentSessions.messageCount} IS NULL OR ${agentSessions.messageCount} = 0 THEN '0'
          WHEN ${agentSessions.messageCount} BETWEEN 1 AND 5 THEN '1-5'
          WHEN ${agentSessions.messageCount} BETWEEN 6 AND 10 THEN '6-10'
          WHEN ${agentSessions.messageCount} BETWEEN 11 AND 20 THEN '11-20'
          WHEN ${agentSessions.messageCount} BETWEEN 21 AND 50 THEN '21-50'
          ELSE '50+'
        END`
      );

    // Sort buckets in order (0 bucket first for sessions with no messages)
    const bucketOrder = ['0', '1-5', '6-10', '11-20', '21-50', '50+'];
    const sortedResult = bucketOrder
      .map((bucket) => {
        const found = result.find((r) => r.bucket === bucket);
        return {
          bucket,
          sessionCount: found ? Number(found.sessionCount) : 0,
        };
      })
      .filter((r) => r.sessionCount > 0);

    return sortedResult;
  }
}

// ========================================
// Tool Calls Per Session Query
// ========================================

export interface GetToolCallsPerSessionInput {
  orgId: string;
  timeRange: TimeRange;
  userId?: string;
}

export interface ToolCallsPerSessionStats {
  totalSessions: number;
  totalToolCalls: number;
  avgToolCallsPerSession: number;
  maxToolCallsInSession: number;
}

export type GetToolCallsPerSessionResult = ToolCallsPerSessionStats;

export class GetToolCallsPerSessionQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: GetToolCallsPerSessionInput
  ): Promise<GetToolCallsPerSessionResult> {
    const startDate = getStartDate(input.timeRange);

    const sessionConditions = [eq(agentSessions.orgId, input.orgId)];
    if (startDate) {
      sessionConditions.push(gte(agentSessions.createdAt, startDate));
    }
    if (input.userId) {
      sessionConditions.push(eq(agentSessions.userId, input.userId));
    }

    // Get per-session tool call counts with SQL aggregation
    // This query groups by session and counts tool calls, then we aggregate in a second query
    const perSessionCounts = await this.db
      .select({
        toolCallCount: sql<number>`COUNT(${agentSessionEvents.id})::int`,
      })
      .from(agentSessions)
      .leftJoin(
        agentSessionEvents,
        and(
          eq(agentSessionEvents.sessionId, agentSessions.id),
          eq(agentSessionEvents.type, 'tool_call')
        )
      )
      .where(and(...sessionConditions))
      .groupBy(agentSessions.id);

    // Calculate aggregate stats from the per-session counts
    const totalSessions = perSessionCounts.length;
    if (totalSessions === 0) {
      return {
        totalSessions: 0,
        totalToolCalls: 0,
        avgToolCallsPerSession: 0,
        maxToolCallsInSession: 0,
      };
    }

    const counts = perSessionCounts.map((r) => Number(r.toolCallCount));
    const totalToolCalls = counts.reduce((sum, c) => sum + c, 0);
    const maxToolCallsInSession = Math.max(...counts);
    const avgToolCallsPerSession =
      Math.round((totalToolCalls / totalSessions) * 100) / 100;

    return {
      totalSessions,
      totalToolCalls,
      avgToolCallsPerSession,
      maxToolCallsInSession,
    };
  }
}

// ========================================
// Tool Type Distribution Query
// ========================================

export interface GetToolTypeDistributionInput {
  orgId: string;
  timeRange: TimeRange;
  userId?: string;
}

export interface ToolTypeDistributionItem {
  toolName: string;
  callCount: number;
  percentage: number;
}

export type GetToolTypeDistributionResult = ToolTypeDistributionItem[];

export class GetToolTypeDistributionQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: GetToolTypeDistributionInput
  ): Promise<GetToolTypeDistributionResult> {
    const startDate = getStartDate(input.timeRange);

    const conditions = [
      eq(agentSessions.orgId, input.orgId),
      eq(agentSessionEvents.type, 'tool_call'),
    ];
    if (startDate) {
      conditions.push(gte(agentSessions.createdAt, startDate));
    }
    if (input.userId) {
      conditions.push(eq(agentSessions.userId, input.userId));
    }

    const result = await this.db
      .select({
        toolName: agentSessionEvents.toolName,
        callCount: count(),
      })
      .from(agentSessionEvents)
      .innerJoin(
        agentSessions,
        eq(agentSessionEvents.sessionId, agentSessions.id)
      )
      .where(and(...conditions))
      .groupBy(agentSessionEvents.toolName)
      .orderBy(sql`count(*) DESC`)
      .limit(15);

    // Calculate total for percentages
    const total = result.reduce((sum, r) => sum + Number(r.callCount), 0);

    return result.map((r) => ({
      toolName: r.toolName ?? 'unknown',
      callCount: Number(r.callCount),
      percentage:
        total > 0 ? Math.round((Number(r.callCount) / total) * 1000) / 10 : 0,
    }));
  }
}

// ========================================
// Tool Call Errors Query
// ========================================

export interface GetToolCallErrorsInput {
  orgId: string;
  timeRange: TimeRange;
  userId?: string;
}

export interface ToolCallErrorStats {
  totalToolCalls: number;
  errorCount: number;
  errorRatePercentage: number;
}

export type GetToolCallErrorsResult = ToolCallErrorStats;

export class GetToolCallErrorsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: GetToolCallErrorsInput
  ): Promise<GetToolCallErrorsResult> {
    const startDate = getStartDate(input.timeRange);

    const conditions = [eq(agentSessions.orgId, input.orgId)];
    if (startDate) {
      conditions.push(gte(agentSessions.createdAt, startDate));
    }
    if (input.userId) {
      conditions.push(eq(agentSessions.userId, input.userId));
    }

    const result = await this.db
      .select({
        totalToolCalls: sql<number>`COUNT(*) FILTER (WHERE ${agentSessionEvents.type} = 'tool_call')`,
        errorCount: sql<number>`COUNT(*) FILTER (WHERE ${agentSessionEvents.type} = 'tool_result' AND ${agentSessionEvents.isError} = true)`,
      })
      .from(agentSessionEvents)
      .innerJoin(
        agentSessions,
        eq(agentSessionEvents.sessionId, agentSessions.id)
      )
      .where(and(...conditions));

    const stats = result[0] ?? { totalToolCalls: 0, errorCount: 0 };
    const totalToolCalls = Number(stats.totalToolCalls);
    const errorCount = Number(stats.errorCount);
    const errorRatePercentage =
      totalToolCalls > 0
        ? Math.round((errorCount / totalToolCalls) * 1000) / 10
        : 0;

    return {
      totalToolCalls,
      errorCount,
      errorRatePercentage,
    };
  }
}
