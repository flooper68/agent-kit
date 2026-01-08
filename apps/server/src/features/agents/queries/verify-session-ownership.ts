import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';

export interface VerifySessionOwnershipInput {
  sessionId: string;
  userId: string;
  orgId?: string;
}

export type VerifySessionOwnershipResult = boolean;

export class VerifySessionOwnershipQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  /**
   * Verifies that a session belongs to the specified user.
   * If orgId is provided, also verifies the session belongs to that organization
   * to prevent cross-tenant data access when switching organizations.
   */
  async execute(
    input: VerifySessionOwnershipInput
  ): Promise<VerifySessionOwnershipResult> {
    const { sessionId, userId, orgId } = input;
    const conditions = [
      eq(agentSessions.id, sessionId),
      eq(agentSessions.userId, userId),
    ];

    // If orgId is provided, also verify organization ownership
    if (orgId) {
      conditions.push(eq(agentSessions.orgId, orgId));
    }

    const [session] = await this.db
      .select({ id: agentSessions.id })
      .from(agentSessions)
      .where(and(...conditions));

    return session !== undefined;
  }
}
