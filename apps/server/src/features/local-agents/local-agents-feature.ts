import { eq, and } from 'drizzle-orm';
import { createHash } from 'crypto';
import type { db as DbType } from '../../db';
import { localAgents, type LocalAgent } from '../../db/schema';

export interface CreateLocalAgentInput {
  userId: string;
  name: string;
  description?: string;
}

export interface UpdateLocalAgentInput {
  name?: string;
  description?: string;
}

export interface LocalAgentListItem {
  id: string;
  name: string;
  description: string | null;
  disabled: boolean;
  secretKeyPrefix: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * LocalAgentsFeature - manages user-created local agents
 */
export class LocalAgentsFeature {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  /**
   * Generate a new secret key with the ak_local_ prefix
   */
  private generateSecretKey(): string {
    return `ak_local_${crypto.randomUUID()}`;
  }

  /**
   * Hash a secret key using SHA256
   */
  private hashSecretKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * Generate a display prefix from a secret key (e.g., "ak_local_abc1...")
   */
  private generateKeyPrefix(key: string): string {
    return key.substring(0, 20) + '...';
  }

  /**
   * Create a new local agent with auto-generated secret key
   * Returns the agent AND the plaintext secret key (only returned once)
   */
  async create(
    input: CreateLocalAgentInput
  ): Promise<{ agent: LocalAgent; secretKey: string }> {
    const secretKey = this.generateSecretKey();
    const secretKeyHash = this.hashSecretKey(secretKey);
    const secretKeyPrefix = this.generateKeyPrefix(secretKey);

    const [agent] = await this.db
      .insert(localAgents)
      .values({
        userId: input.userId,
        name: input.name,
        description: input.description,
        secretKey: secretKeyHash,
        secretKeyPrefix,
      })
      .returning();

    if (!agent) {
      throw new Error('Failed to create local agent');
    }

    // Return plaintext key - this is the only time it's available
    return { agent, secretKey };
  }

  /**
   * List all local agents for a user
   * Returns only the key prefix, not the full key (which is hashed in DB)
   */
  async list(userId: string): Promise<LocalAgentListItem[]> {
    const agents = await this.db
      .select({
        id: localAgents.id,
        name: localAgents.name,
        description: localAgents.description,
        disabled: localAgents.disabled,
        secretKeyPrefix: localAgents.secretKeyPrefix,
        createdAt: localAgents.createdAt,
        updatedAt: localAgents.updatedAt,
      })
      .from(localAgents)
      .where(eq(localAgents.userId, userId))
      .orderBy(localAgents.createdAt);

    return agents;
  }

  /**
   * Get a single local agent by ID (verifies ownership)
   */
  async getById(id: string, userId: string): Promise<LocalAgent | null> {
    const [agent] = await this.db
      .select()
      .from(localAgents)
      .where(and(eq(localAgents.id, id), eq(localAgents.userId, userId)));

    return agent ?? null;
  }

  /**
   * Update a local agent's configuration
   */
  async update(
    id: string,
    userId: string,
    updates: UpdateLocalAgentInput
  ): Promise<LocalAgent | null> {
    const [agent] = await this.db
      .update(localAgents)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(localAgents.id, id), eq(localAgents.userId, userId)))
      .returning();

    return agent ?? null;
  }

  /**
   * Enable or disable a local agent (soft delete)
   */
  async setDisabled(
    id: string,
    userId: string,
    disabled: boolean
  ): Promise<LocalAgent | null> {
    const [agent] = await this.db
      .update(localAgents)
      .set({
        disabled,
        updatedAt: new Date(),
      })
      .where(and(eq(localAgents.id, id), eq(localAgents.userId, userId)))
      .returning();

    return agent ?? null;
  }

  /**
   * Regenerate the secret key for a local agent
   * Returns the new plaintext key (only returned once)
   */
  async regenerateKey(id: string, userId: string): Promise<string | null> {
    const newSecretKey = this.generateSecretKey();
    const secretKeyHash = this.hashSecretKey(newSecretKey);
    const secretKeyPrefix = this.generateKeyPrefix(newSecretKey);

    const [agent] = await this.db
      .update(localAgents)
      .set({
        secretKey: secretKeyHash,
        secretKeyPrefix,
        updatedAt: new Date(),
      })
      .where(and(eq(localAgents.id, id), eq(localAgents.userId, userId)))
      .returning();

    if (!agent) {
      return null;
    }

    // Return plaintext key - this is the only time it's available
    return newSecretKey;
  }

  /**
   * Validate a secret key and return the associated agent
   * Used for webhook authentication
   * Only returns enabled agents (disabled agents cannot authenticate)
   */
  async validateKey(secretKey: string): Promise<LocalAgent | null> {
    const secretKeyHash = this.hashSecretKey(secretKey);

    const [agent] = await this.db
      .select()
      .from(localAgents)
      .where(
        and(
          eq(localAgents.secretKey, secretKeyHash),
          eq(localAgents.disabled, false)
        )
      );

    return agent ?? null;
  }
}
