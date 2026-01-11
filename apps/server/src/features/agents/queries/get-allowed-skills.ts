import { eq, and, isNull } from 'drizzle-orm';
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
 * Uses JOINs to fetch skills in a single query per agent type.
 */
export class GetAllowedSkillsQuery {
  constructor(private db: typeof DbType) {}

  async execute(input: GetAllowedSkillsInput): Promise<AllowedSkillInfo[]> {
    const { agentKey, userId } = input;

    // Try server agent first with JOIN query
    const serverAgentSkills = await this.db
      .select({
        id: skills.id,
        key: skills.key,
        name: skills.name,
        description: skills.description,
        isSystem: skills.isSystem,
      })
      .from(skills)
      .innerJoin(
        serverAgentAllowedSkills,
        eq(skills.id, serverAgentAllowedSkills.skillId)
      )
      .innerJoin(
        serverAgents,
        eq(serverAgentAllowedSkills.serverAgentId, serverAgents.id)
      )
      .where(
        and(
          eq(serverAgents.key, agentKey),
          eq(serverAgents.userId, userId),
          isNull(serverAgents.deletedAt)
        )
      );

    if (serverAgentSkills.length > 0) {
      return serverAgentSkills;
    }

    // Fall back to external agent with JOIN query
    const externalAgentSkills = await this.db
      .select({
        id: skills.id,
        key: skills.key,
        name: skills.name,
        description: skills.description,
        isSystem: skills.isSystem,
      })
      .from(skills)
      .innerJoin(
        externalAgentAllowedSkills,
        eq(skills.id, externalAgentAllowedSkills.skillId)
      )
      .innerJoin(
        externalAgents,
        eq(externalAgentAllowedSkills.externalAgentId, externalAgents.id)
      )
      .where(
        and(
          eq(externalAgents.key, agentKey),
          eq(externalAgents.userId, userId),
          isNull(externalAgents.deletedAt)
        )
      );

    return externalAgentSkills;
  }
}
