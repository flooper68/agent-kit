import type { db as DbType } from '../../db';
import type { SlashCommand } from '../../db/schema';
import type { CacheInvalidationService } from '../../real-time';
import {
  CreateSlashCommandCommand,
  UpdateSlashCommandCommand,
  DeleteSlashCommandCommand,
} from './commands';
import type {
  CreateSlashCommandInput,
  UpdateSlashCommandInput,
  DeleteSlashCommandInput,
} from './commands';
import {
  GetSlashCommandByIdQuery,
  ListSlashCommandsQuery,
  SearchSlashCommandsQuery,
} from './queries';
import type {
  GetSlashCommandByIdInput,
  ListSlashCommandsInput,
  ListSlashCommandsResult,
  SearchSlashCommandsInput,
  SearchSlashCommandsResult,
} from './queries';

/**
 * SlashCommandsFeature - provides slash command CRUD and query operations
 */
export class SlashCommandsFeature {
  private createSlashCommandCommand: CreateSlashCommandCommand;
  private updateSlashCommandCommand: UpdateSlashCommandCommand;
  private deleteSlashCommandCommand: DeleteSlashCommandCommand;
  private getSlashCommandByIdQuery: GetSlashCommandByIdQuery;
  private listSlashCommandsQuery: ListSlashCommandsQuery;
  private searchSlashCommandsQuery: SearchSlashCommandsQuery;
  private cacheInvalidation?: CacheInvalidationService;

  constructor(db: typeof DbType) {
    this.createSlashCommandCommand = new CreateSlashCommandCommand(db);
    this.updateSlashCommandCommand = new UpdateSlashCommandCommand(db);
    this.deleteSlashCommandCommand = new DeleteSlashCommandCommand(db);
    this.getSlashCommandByIdQuery = new GetSlashCommandByIdQuery(db);
    this.listSlashCommandsQuery = new ListSlashCommandsQuery(db);
    this.searchSlashCommandsQuery = new SearchSlashCommandsQuery(db);
  }

  /**
   * Set the cache invalidation service for real-time updates
   */
  setCacheInvalidation(cacheInvalidation: CacheInvalidationService): void {
    this.cacheInvalidation = cacheInvalidation;
  }

  // Commands
  async create(input: CreateSlashCommandInput): Promise<SlashCommand> {
    const command = await this.createSlashCommandCommand.execute(input);
    if (this.cacheInvalidation) {
      await this.cacheInvalidation.publishSlashCommandCreated(
        input.userId,
        command.id
      );
    }
    return command;
  }

  async update(
    input: UpdateSlashCommandInput
  ): Promise<SlashCommand | undefined> {
    const command = await this.updateSlashCommandCommand.execute(input);
    if (command && this.cacheInvalidation) {
      await this.cacheInvalidation.publishSlashCommandUpdated(
        input.userId,
        command.id
      );
    }
    return command;
  }

  async delete(
    input: DeleteSlashCommandInput
  ): Promise<SlashCommand | undefined> {
    const command = await this.deleteSlashCommandCommand.execute(input);
    if (command && this.cacheInvalidation) {
      await this.cacheInvalidation.publishSlashCommandDeleted(
        input.userId,
        command.id
      );
    }
    return command;
  }

  // Queries
  getById(input: GetSlashCommandByIdInput): Promise<SlashCommand | undefined> {
    return this.getSlashCommandByIdQuery.execute(input);
  }

  list(input: ListSlashCommandsInput): Promise<ListSlashCommandsResult> {
    return this.listSlashCommandsQuery.execute(input);
  }

  search(input: SearchSlashCommandsInput): Promise<SearchSlashCommandsResult> {
    return this.searchSlashCommandsQuery.execute(input);
  }
}
