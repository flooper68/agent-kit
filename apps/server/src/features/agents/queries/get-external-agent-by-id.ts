import { eq, and, isNull } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { externalAgents, type ExternalAgent } from '../../../db/schema';

export interface GetExternalAgentByIdInput {
  id: string;
}

export type GetExternalAgentByIdResult = ExternalAgent | null;

/**
 * Get an external agent by its ID.
 * Used to fetch fresh agent details for each message/tool request.
 * Returns null if agent is deleted.
 */
export class GetExternalAgentByIdQuery {
  constructor(private db: typeof DbType) {}

  async execute(
    input: GetExternalAgentByIdInput
  ): Promise<GetExternalAgentByIdResult> {
    const { id } = input;
    const [agent] = await this.db
      .select()
      .from(externalAgents)
      .where(and(eq(externalAgents.id, id), isNull(externalAgents.deletedAt)));

    return agent ?? null;
  }
}
