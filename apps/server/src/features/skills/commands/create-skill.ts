import { skills, type Skill, type SkillFile } from '../../../db/schema';
import type { SkillsCommandContextManager } from '../context';

export interface CreateSkillInput {
  userId: string;
  orgId: string;
  key: string;
  name: string;
  description: string;
  files: SkillFile[];
}

export type CreateSkillResult = Skill;

/**
 * Create a new user skill.
 * System skills cannot be created through this command.
 */
export class CreateSkillCommand {
  constructor(private readonly contextManager: SkillsCommandContextManager) {}

  execute = async (input: CreateSkillInput): Promise<CreateSkillResult> => {
    return this.contextManager.handleCommand(async (ctx) => {
      const { tx } = ctx;

      const [skill] = await tx
        .insert(skills)
        .values({
          key: input.key,
          name: input.name,
          description: input.description,
          files: input.files,
          isSystem: false,
          userId: input.userId,
          orgId: input.orgId,
        })
        .returning();

      if (!skill) {
        throw new Error('Failed to create skill');
      }

      return skill;
    });
  };
}
