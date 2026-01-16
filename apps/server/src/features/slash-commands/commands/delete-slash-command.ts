import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { slashCommands, type SlashCommand } from '../../../db/schema';

export interface DeleteSlashCommandInput {
  id: string;
  userId: string;
  orgId: string;
}

export type DeleteSlashCommandResult = SlashCommand | undefined;

export class DeleteSlashCommandCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: DeleteSlashCommandInput
  ): Promise<DeleteSlashCommandResult> {
    const { id, userId, orgId } = input;

    const [command] = await this.db
      .delete(slashCommands)
      .where(
        and(
          eq(slashCommands.id, id),
          eq(slashCommands.userId, userId),
          eq(slashCommands.orgId, orgId)
        )
      )
      .returning();

    return command;
  }
}
