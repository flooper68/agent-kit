import { eq, and, isNull, inArray } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  serverAgents,
  externalAgents,
  serverAgentAllowedSkills,
  externalAgentAllowedSkills,
  skills,
} from '../../../db/schema';

export interface AllowedSkillInfo {
  id: string;
  key: string;
  name: string;
  description: string;
  isSystem: boolean;
}

export interface GetAllowedSkillsInput {
  agentKey: string;
  userId: string;
}

/**
 * Get the list of allowed skills for a given agent.
 * Returns full details (id, key, name, description, isSystem) for each allowed skill.
 */
export class GetAllowedSkillsQuery {
  constructor(private db: typeof DbType) {}

  async execute(input: GetAllowedSkillsInput): Promise<AllowedSkillInfo[]> {
    const { agentKey, userId } = input;

    // Find parent agent and get allowed skill IDs
    const skillIds = await this.findParentAndGetAllowedSkillIds(
      agentKey,
      userId
    );

    if (!skillIds || skillIds.length === 0) {
      // Agent not found or no skills configured
      return [];
    }

    // Fetch skill details
    const skillResults = await this.db
      .select({
        id: skills.id,
        key: skills.key,
        name: skills.name,
        description: skills.description,
        isSystem: skills.isSystem,
      })
      .from(skills)
      .where(inArray(skills.id, skillIds));

    return skillResults;
  }

  /**
   * Find parent agent and return its allowed skill IDs
   */
  private async findParentAndGetAllowedSkillIds(
    key: string,
    userId: string
  ): Promise<string[] | null> {
    // Check server agents first
    const [serverAgent] = await this.db
      .select({ id: serverAgents.id })
      .from(serverAgents)
      .where(
        and(
          eq(serverAgents.key, key),
          eq(serverAgents.userId, userId),
          isNull(serverAgents.deletedAt)
        )
      )
      .limit(1);

    if (serverAgent) {
      return this.getServerAgentAllowedSkillIds(serverAgent.id);
    }

    // Check external agents
    const [externalAgent] = await this.db
      .select({ id: externalAgents.id })
      .from(externalAgents)
      .where(
        and(
          eq(externalAgents.key, key),
          eq(externalAgents.userId, userId),
          isNull(externalAgents.deletedAt)
        )
      )
      .limit(1);

    if (externalAgent) {
      return this.getExternalAgentAllowedSkillIds(externalAgent.id);
    }

    return null;
  }

  /**
   * Get allowed skill IDs for a server agent
   */
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

  /**
   * Get allowed skill IDs for an external agent
   */
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
