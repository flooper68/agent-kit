import type { db as DbType } from '../../db';
import type { SlashCommand } from '../../db/schema';
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

  constructor(db: typeof DbType) {
    this.createSlashCommandCommand = new CreateSlashCommandCommand(db);
    this.updateSlashCommandCommand = new UpdateSlashCommandCommand(db);
    this.deleteSlashCommandCommand = new DeleteSlashCommandCommand(db);
    this.getSlashCommandByIdQuery = new GetSlashCommandByIdQuery(db);
    this.listSlashCommandsQuery = new ListSlashCommandsQuery(db);
    this.searchSlashCommandsQuery = new SearchSlashCommandsQuery(db);
  }

  // Commands
  async create(input: CreateSlashCommandInput): Promise<SlashCommand> {
    return this.createSlashCommandCommand.execute(input);
  }

  async update(
    input: UpdateSlashCommandInput
  ): Promise<SlashCommand | undefined> {
    return this.updateSlashCommandCommand.execute(input);
  }

  async delete(
    input: DeleteSlashCommandInput
  ): Promise<SlashCommand | undefined> {
    return this.deleteSlashCommandCommand.execute(input);
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
