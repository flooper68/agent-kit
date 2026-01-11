import type { db as DbType } from '../../db';
import type { CacheInvalidationService } from '../../real-time';
import { SkillsCommandContextManager } from './context';
import {
  CreateSkillCommand,
  UpdateSkillCommand,
  DeleteSkillCommand,
} from './commands';
import type {
  CreateSkillInput,
  UpdateSkillInput,
  DeleteSkillInput,
} from './commands';
import {
  ListSkillsQuery,
  GetSkillByIdQuery,
  GetSkillByKeyQuery,
  GetAllSkillsQuery,
} from './queries';
import type {
  ListSkillsInput,
  GetSkillByIdInput,
  GetSkillByKeyInput,
  GetAllSkillsInput,
} from './queries';

/**
 * SkillsFeature - main class that composes all command and query handlers
 * for skill-related database operations
 */
export class SkillsFeature {
  // Context manager for transaction handling
  private contextManager: SkillsCommandContextManager;

  // Cache invalidation service (optional)
  private skillsCacheInvalidation?: CacheInvalidationService;

  // Commands
  private createSkillCommand: CreateSkillCommand;
  private updateSkillCommand: UpdateSkillCommand;
  private deleteSkillCommand: DeleteSkillCommand;

  // Queries
  private listSkillsQuery: ListSkillsQuery;
  private getSkillByIdQuery: GetSkillByIdQuery;
  private getSkillByKeyQuery: GetSkillByKeyQuery;
  private getAllSkillsQuery: GetAllSkillsQuery;

  constructor(db: typeof DbType) {
    // Initialize context manager with getter for late-initialized cache invalidation
    this.contextManager = new SkillsCommandContextManager(
      db,
      () => this.skillsCacheInvalidation
    );

    // Initialize commands
    this.createSkillCommand = new CreateSkillCommand(this.contextManager);
    this.updateSkillCommand = new UpdateSkillCommand(this.contextManager);
    this.deleteSkillCommand = new DeleteSkillCommand(this.contextManager);

    // Initialize queries
    this.listSkillsQuery = new ListSkillsQuery(db);
    this.getSkillByIdQuery = new GetSkillByIdQuery(db);
    this.getSkillByKeyQuery = new GetSkillByKeyQuery(db);
    this.getAllSkillsQuery = new GetAllSkillsQuery(db);
  }

  /**
   * Set the CacheInvalidationService for skill cache invalidation
   * Must be called after Redis-dependent services are ready
   */
  setSkillsCacheInvalidation(service: CacheInvalidationService): void {
    this.skillsCacheInvalidation = service;
  }

  /**
   * Create a new user skill
   */
  create(input: CreateSkillInput) {
    return this.createSkillCommand.execute(input);
  }

  /**
   * Update an existing user skill
   */
  update(input: UpdateSkillInput) {
    return this.updateSkillCommand.execute(input);
  }

  /**
   * Delete a user skill
   */
  delete(input: DeleteSkillInput) {
    return this.deleteSkillCommand.execute(input);
  }

  /**
   * List skills with pagination and filtering
   */
  list(input: ListSkillsInput) {
    return this.listSkillsQuery.execute(input);
  }

  /**
   * Get a skill by ID
   */
  getById(input: GetSkillByIdInput) {
    return this.getSkillByIdQuery.execute(input);
  }

  /**
   * Get a skill by key
   */
  getByKey(input: GetSkillByKeyInput) {
    return this.getSkillByKeyQuery.execute(input);
  }

  /**
   * Get all skills accessible to a user
   * Used by skill tools (grepSkills, readSkillFile)
   */
  getAll(input: GetAllSkillsInput) {
    return this.getAllSkillsQuery.execute(input);
  }
}
