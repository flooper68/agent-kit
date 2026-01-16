import type { db as DbType } from '../../../db';
import { slashCommands, type SlashCommand } from '../../../db/schema';

export interface CreateSlashCommandInput {
  userId: string;
  orgId: string;
  key: string;
  name: string;
  description?: string;
  prompt: string;
}

export type CreateSlashCommandResult = SlashCommand;

/** Error thrown when a slash command with the same key already exists */
export class DuplicateKeyError extends Error {
  constructor(key: string) {
    super(`A command with key "${key}" already exists`);
    this.name = 'DuplicateKeyError';
  }
}

export class CreateSlashCommandCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: CreateSlashCommandInput
  ): Promise<CreateSlashCommandResult> {
    // Key should already be validated by the router, use as-is
    const normalizedKey = input.key.toLowerCase();

    try {
      const [command] = await this.db
        .insert(slashCommands)
        .values({
          userId: input.userId,
          orgId: input.orgId,
          key: normalizedKey,
          name: input.name,
          description: input.description,
          prompt: input.prompt,
        })
        .returning();

      if (!command) {
        throw new Error('Failed to create slash command');
      }

      return command;
    } catch (error) {
      // Handle unique constraint violation (duplicate key)
      if (
        error instanceof Error &&
        error.message.includes('slash_commands_org_user_key_idx')
      ) {
        throw new DuplicateKeyError(normalizedKey);
      }
      throw error;
    }
  }
}
