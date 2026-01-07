import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';
import type { AgentSession, CreateSessionInput } from '../types';

export interface CreateSessionValidators {
  hasBuiltInAgent: (id: string) => boolean;
  getLocalAgent: (
    id: string,
    userId: string
  ) => Promise<{ disabled: boolean } | null>;
}

export class CreateSessionCommand {
  private db: typeof DbType;
  private validators: CreateSessionValidators;

  constructor(db: typeof DbType, validators: CreateSessionValidators) {
    this.db = db;
    this.validators = validators;
  }

  async execute(input: CreateSessionInput): Promise<AgentSession> {
    const isLocalAgent = input.isLocalAgent ?? false;

    // Validate agent exists
    if (isLocalAgent) {
      const localAgent = await this.validators.getLocalAgent(
        input.agentId,
        input.userId
      );
      if (!localAgent) {
        throw new Error('Local agent not found');
      }
      if (localAgent.disabled) {
        throw new Error('Cannot create session with disabled agent');
      }
    } else {
      if (!this.validators.hasBuiltInAgent(input.agentId)) {
        throw new Error(`Agent not found: ${input.agentId}`);
      }
    }

    const [session] = await this.db
      .insert(agentSessions)
      .values({
        userId: input.userId,
        orgId: input.orgId,
        agentId: input.agentId,
        title: input.title,
        isLocalAgent,
        parentSessionId: input.parentSessionId,
        spawnDepth: input.spawnDepth ?? 0,
      })
      .returning();

    if (!session) {
      throw new Error('Failed to create session');
    }
    return session;
  }
}
