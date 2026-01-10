import { eq, and, isNull } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  serverAgents,
  externalAgents,
  serverAgentAllowedSubagents,
  externalAgentAllowedSubagents,
  serverAgentAllowedSkills,
  externalAgentAllowedSkills,
  type ServerAgent,
  type ExternalAgent,
} from '../../../db/schema';

export interface GetAgentByIdInput {
  id: string;
  userId: string;
}

export interface AllowedSubagentsResult {
  serverAgentIds: string[];
  externalAgentIds: string[];
}

export type GetAgentByIdResult =
  | ((ServerAgent | ExternalAgent) & {
      allowedSubagents: AllowedSubagentsResult;
      allowedSkillIds: string[];
    })
  | null;

/**
 * Get a single custom agent by ID (verifies ownership).
 * Checks both server and external agent tables.
 * Used by Agent Builder for editing agents.
 * Excludes deleted agents.
 */
export class GetAgentByIdQuery {
  constructor(private db: typeof DbType) {}

  async execute(input: GetAgentByIdInput): Promise<GetAgentByIdResult> {
    const { id, userId } = input;

    // First try to find as server agent
    const [serverAgent] = await this.db
      .select()
      .from(serverAgents)
      .where(
        and(
          eq(serverAgents.id, id),
          eq(serverAgents.userId, userId),
          isNull(serverAgents.deletedAt)
        )
      );

    if (serverAgent) {
      const [allowedSubagents, allowedSkillIds] = await Promise.all([
        this.getServerAgentAllowedSubagents(id),
        this.getServerAgentAllowedSkillIds(id),
      ]);
      return { ...serverAgent, allowedSubagents, allowedSkillIds };
    }

    // Try to find as external agent
    const [externalAgent] = await this.db
      .select()
      .from(externalAgents)
      .where(
        and(
          eq(externalAgents.id, id),
          eq(externalAgents.userId, userId),
          isNull(externalAgents.deletedAt)
        )
      );

    if (externalAgent) {
      const [allowedSubagents, allowedSkillIds] = await Promise.all([
        this.getExternalAgentAllowedSubagents(id),
        this.getExternalAgentAllowedSkillIds(id),
      ]);
      return { ...externalAgent, allowedSubagents, allowedSkillIds };
    }

    return null;
  }

  private async getServerAgentAllowedSubagents(
    serverAgentId: string
  ): Promise<AllowedSubagentsResult> {
    const entries = await this.db
      .select({
        allowedServerAgentId: serverAgentAllowedSubagents.allowedServerAgentId,
        allowedExternalAgentId:
          serverAgentAllowedSubagents.allowedExternalAgentId,
      })
      .from(serverAgentAllowedSubagents)
      .where(eq(serverAgentAllowedSubagents.serverAgentId, serverAgentId));

    const serverAgentIds: string[] = [];
    const externalAgentIds: string[] = [];

    for (const entry of entries) {
      if (entry.allowedServerAgentId) {
        serverAgentIds.push(entry.allowedServerAgentId);
      }
      if (entry.allowedExternalAgentId) {
        externalAgentIds.push(entry.allowedExternalAgentId);
      }
    }

    return { serverAgentIds, externalAgentIds };
  }

  private async getExternalAgentAllowedSubagents(
    externalAgentId: string
  ): Promise<AllowedSubagentsResult> {
    const entries = await this.db
      .select({
        allowedServerAgentId:
          externalAgentAllowedSubagents.allowedServerAgentId,
        allowedExternalAgentId:
          externalAgentAllowedSubagents.allowedExternalAgentId,
      })
      .from(externalAgentAllowedSubagents)
      .where(
        eq(externalAgentAllowedSubagents.externalAgentId, externalAgentId)
      );

    const serverAgentIds: string[] = [];
    const externalAgentIds: string[] = [];

    for (const entry of entries) {
      if (entry.allowedServerAgentId) {
        serverAgentIds.push(entry.allowedServerAgentId);
      }
      if (entry.allowedExternalAgentId) {
        externalAgentIds.push(entry.allowedExternalAgentId);
      }
    }

    return { serverAgentIds, externalAgentIds };
  }

  private async getServerAgentAllowedSkillIds(
    serverAgentId: string
  ): Promise<string[]> {
    const entries = await this.db
      .select({
        skillId: serverAgentAllowedSkills.skillId,
      })
      .from(serverAgentAllowedSkills)
      .where(eq(serverAgentAllowedSkills.serverAgentId, serverAgentId));

    return entries.map((e) => e.skillId);
  }

  private async getExternalAgentAllowedSkillIds(
    externalAgentId: string
  ): Promise<string[]> {
    const entries = await this.db
      .select({
        skillId: externalAgentAllowedSkills.skillId,
      })
      .from(externalAgentAllowedSkills)
      .where(eq(externalAgentAllowedSkills.externalAgentId, externalAgentId));

    return entries.map((e) => e.skillId);
  }
}
