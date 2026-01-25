import type { db as DbType } from '../../db';
import type { CacheInvalidationService } from '../../real-time';
import { ScheduledJobsCommandContextManager } from './context';
import {
  CreateScheduledJobCommand,
  UpdateScheduledJobCommand,
  DeleteScheduledJobCommand,
} from './commands';
import type {
  CreateScheduledJobInput,
  UpdateScheduledJobInput,
  DeleteScheduledJobInput,
} from './commands';
import { ListScheduledJobsQuery, GetScheduledJobByIdQuery } from './queries';
import type {
  ListScheduledJobsInput,
  GetScheduledJobByIdInput,
} from './queries';

/**
 * ScheduledJobsFeature - main class that composes all command and query handlers
 * for scheduled job-related database operations
 */
export class ScheduledJobsFeature {
  // Context manager for transaction handling
  private contextManager: ScheduledJobsCommandContextManager;

  // Cache invalidation service (optional)
  private cacheInvalidation?: CacheInvalidationService;

  // Commands
  private createScheduledJobCommand: CreateScheduledJobCommand;
  private updateScheduledJobCommand: UpdateScheduledJobCommand;
  private deleteScheduledJobCommand: DeleteScheduledJobCommand;

  // Queries
  private listScheduledJobsQuery: ListScheduledJobsQuery;
  private getScheduledJobByIdQuery: GetScheduledJobByIdQuery;

  constructor(db: typeof DbType) {
    // Initialize context manager with getter for late-initialized cache invalidation
    this.contextManager = new ScheduledJobsCommandContextManager(
      db,
      () => this.cacheInvalidation
    );

    // Initialize commands
    this.createScheduledJobCommand = new CreateScheduledJobCommand(
      this.contextManager
    );
    this.updateScheduledJobCommand = new UpdateScheduledJobCommand(
      this.contextManager
    );
    this.deleteScheduledJobCommand = new DeleteScheduledJobCommand(
      this.contextManager
    );

    // Initialize queries
    this.listScheduledJobsQuery = new ListScheduledJobsQuery(db);
    this.getScheduledJobByIdQuery = new GetScheduledJobByIdQuery(db);
  }

  /**
   * Set the CacheInvalidationService for cache invalidation
   * Must be called after Redis-dependent services are ready
   */
  setCacheInvalidation(service: CacheInvalidationService): void {
    this.cacheInvalidation = service;
  }

  /**
   * Create a new scheduled job
   */
  create(input: CreateScheduledJobInput) {
    return this.createScheduledJobCommand.execute(input);
  }

  /**
   * Update an existing scheduled job
   */
  update(input: UpdateScheduledJobInput) {
    return this.updateScheduledJobCommand.execute(input);
  }

  /**
   * Delete a scheduled job
   */
  delete(input: DeleteScheduledJobInput) {
    return this.deleteScheduledJobCommand.execute(input);
  }

  /**
   * List scheduled jobs with pagination and filtering
   */
  list(input: ListScheduledJobsInput) {
    return this.listScheduledJobsQuery.execute(input);
  }

  /**
   * Get a scheduled job by ID
   */
  getById(input: GetScheduledJobByIdInput) {
    return this.getScheduledJobByIdQuery.execute(input);
  }
}
