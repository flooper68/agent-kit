import { eq, and, isNull, or } from 'drizzle-orm';
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
  orgId: string;
}

/**
 * Get the list of allowed skills for a given agent.
 * Uses JOINs to fetch skills in a single query per agent type.
 */
export class GetAllowedSkillsQuery {
  constructor(private db: typeof DbType) {}

  async execute(input: GetAllowedSkillsInput): Promise<AllowedSkillInfo[]> {
    const { agentKey, userId, orgId } = input;

    // Try server agent first with JOIN query
    // Filter skills to only include system skills or skills owned by the same org
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
          isNull(serverAgents.deletedAt),
          // Defense-in-depth: only return system skills or skills from the same org
          or(eq(skills.isSystem, true), eq(skills.orgId, orgId))
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
          isNull(externalAgents.deletedAt),
          // Defense-in-depth: only return system skills or skills from the same org
          or(eq(skills.isSystem, true), eq(skills.orgId, orgId))
        )
      );

    return externalAgentSkills;
  }
}
