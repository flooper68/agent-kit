import { eq, and, isNull } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { serverAgents, type ServerAgent } from '../../../db/schema';

export interface GetCustomAgentByIdInput {
  id: string;
  userId: string;
}

export type GetCustomAgentByIdResult = ServerAgent | null;

/**
 * Get a single server agent by ID (verifies ownership).
 * Used by Agent Builder for editing server agents.
 * Excludes deleted agents.
 */
export class GetCustomAgentByIdQuery {
  constructor(private db: typeof DbType) {}

  async execute(
    input: GetCustomAgentByIdInput
  ): Promise<GetCustomAgentByIdResult> {
    const { id, userId } = input;
    const [agent] = await this.db
      .select()
      .from(serverAgents)
      .where(
        and(
          eq(serverAgents.id, id),
          eq(serverAgents.userId, userId),
          isNull(serverAgents.deletedAt)
        )
      );

    return agent ?? null;
  }
}
