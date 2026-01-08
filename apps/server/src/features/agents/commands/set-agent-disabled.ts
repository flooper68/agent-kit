import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  externalAgents,
  serverAgents,
  type ExternalAgent,
  type ServerAgent,
} from '../../../db/schema';

export interface SetAgentDisabledInput {
  id: string;
  userId: string;
  disabled: boolean;
  agentType: 'external' | 'server';
}

export type SetAgentDisabledResult = ExternalAgent | ServerAgent | null;

/**
 * Enable or disable an agent (soft delete).
 */
export class SetAgentDisabledCommand {
  constructor(private db: typeof DbType) {}

  async execute(input: SetAgentDisabledInput): Promise<SetAgentDisabledResult> {
    const { id, userId, disabled, agentType } = input;

    if (agentType === 'external') {
      const [agent] = await this.db
        .update(externalAgents)
        .set({
          disabled,
          updatedAt: new Date(),
        })
        .where(
          and(eq(externalAgents.id, id), eq(externalAgents.userId, userId))
        )
        .returning();
      return agent ?? null;
    }

    const [agent] = await this.db
      .update(serverAgents)
      .set({
        disabled,
        updatedAt: new Date(),
      })
      .where(and(eq(serverAgents.id, id), eq(serverAgents.userId, userId)))
      .returning();

    return agent ?? null;
  }
}
