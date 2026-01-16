import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { slashCommands, type SlashCommand } from '../../../db/schema';

export interface GetSlashCommandByIdInput {
  id: string;
  userId: string;
  orgId: string;
}

export type GetSlashCommandByIdResult = SlashCommand | undefined;

export class GetSlashCommandByIdQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: GetSlashCommandByIdInput
  ): Promise<GetSlashCommandByIdResult> {
    const { id, userId, orgId } = input;

    const [command] = await this.db
      .select()
      .from(slashCommands)
      .where(
        and(
          eq(slashCommands.id, id),
          eq(slashCommands.userId, userId),
          eq(slashCommands.orgId, orgId)
        )
      )
      .limit(1);

    return command;
  }
}
