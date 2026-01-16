import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { slashCommands, type SlashCommand } from '../../../db/schema';

export interface UpdateSlashCommandInput {
  id: string;
  userId: string;
  orgId: string;
  key?: string;
  name?: string;
  description?: string | null;
  prompt?: string;
}

export type UpdateSlashCommandResult = SlashCommand | undefined;

export class UpdateSlashCommandCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: UpdateSlashCommandInput
  ): Promise<UpdateSlashCommandResult> {
    const updates: Partial<{
      key: string;
      name: string;
      description: string | null;
      prompt: string;
      updatedAt: Date;
    }> = {
      updatedAt: new Date(),
    };

    if (input.key !== undefined) {
      // Key should already be validated by the router, just lowercase it
      updates.key = input.key.toLowerCase();
    }

    if (input.name !== undefined) {
      updates.name = input.name;
    }

    if (input.description !== undefined) {
      updates.description = input.description;
    }

    if (input.prompt !== undefined) {
      updates.prompt = input.prompt;
    }

    const [command] = await this.db
      .update(slashCommands)
      .set(updates)
      .where(
        and(
          eq(slashCommands.id, input.id),
          eq(slashCommands.userId, input.userId),
          eq(slashCommands.orgId, input.orgId)
        )
      )
      .returning();

    return command;
  }
}
