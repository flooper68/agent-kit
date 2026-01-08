import type { db as DbType } from '../../../db';
import { agentSessions, type AgentSession } from '../../../db/schema';

export interface CreateSessionInput {
  userId: string;
  orgId: string;
  agentId: string;
  title?: string;
  isLocalAgent?: boolean;
  /** Parent session ID for spawned sessions */
  parentSessionId?: string;
  /** Spawn depth for tracking recursion (0 for root sessions) */
  spawnDepth?: number;
}

export type CreateSessionResult = AgentSession;

export interface CreateSessionValidators {
  hasBuiltInAgent: (id: string) => boolean;
  getAgent: (
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

  async execute(input: CreateSessionInput): Promise<CreateSessionResult> {
    const isLocalAgent = input.isLocalAgent ?? false;

    // Validate agent exists
    if (isLocalAgent) {
      const agent = await this.validators.getAgent(
        input.agentId,
        input.userId
      );
      if (!agent) {
        throw new Error('Agent not found');
      }
      if (agent.disabled) {
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
