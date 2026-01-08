import type { db as DbType } from '../../db';
import type { Task } from '../../db/schema';
import type { CacheInvalidationService } from '../../real-time';
import {
  CreateTaskCommand,
  UpdateTaskCommand,
  DeleteTaskCommand,
  MoveTaskCommand,
  AttachArtifactCommand,
  DetachArtifactCommand,
} from './commands';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  DeleteTaskInput,
  MoveTaskInput,
  AttachArtifactInput,
  DetachArtifactInput,
} from './commands';
import {
  GetTaskByIdQuery,
  ListTasksByProjectQuery,
  GetTasksByStatusQuery,
  SearchTasksQuery,
  GetTaskStatsQuery,
} from './queries';
import type {
  GetTaskByIdInput,
  GetTaskByIdResult,
  ListTasksInput,
  ListTasksByProjectResult,
  GetTasksByStatusInput,
  GetTasksByStatusResult,
  SearchTasksInput,
  SearchTasksResult,
  GetTaskStatsInput,
  GetTaskStatsResult,
} from './queries';

/**
 * TasksFeature - provides task CRUD, move, and query operations
 */
export class TasksFeature {
  private createTaskCommand: CreateTaskCommand;
  private updateTaskCommand: UpdateTaskCommand;
  private deleteTaskCommand: DeleteTaskCommand;
  private moveTaskCommand: MoveTaskCommand;
  private attachArtifactCommand: AttachArtifactCommand;
  private detachArtifactCommand: DetachArtifactCommand;
  private getTaskByIdQuery: GetTaskByIdQuery;
  private listTasksByProjectQuery: ListTasksByProjectQuery;
  private getTasksByStatusQuery: GetTasksByStatusQuery;
  private searchTasksQuery: SearchTasksQuery;
  private getTaskStatsQuery: GetTaskStatsQuery;
  private cacheInvalidation?: CacheInvalidationService;

  constructor(db: typeof DbType) {
    this.createTaskCommand = new CreateTaskCommand(db);
    this.updateTaskCommand = new UpdateTaskCommand(db);
    this.deleteTaskCommand = new DeleteTaskCommand(db);
    this.moveTaskCommand = new MoveTaskCommand(db);
    this.attachArtifactCommand = new AttachArtifactCommand(db);
    this.detachArtifactCommand = new DetachArtifactCommand(db);
    this.getTaskByIdQuery = new GetTaskByIdQuery(db);
    this.listTasksByProjectQuery = new ListTasksByProjectQuery(db);
    this.getTasksByStatusQuery = new GetTasksByStatusQuery(db);
    this.searchTasksQuery = new SearchTasksQuery(db);
    this.getTaskStatsQuery = new GetTaskStatsQuery(db);
  }

  setCacheInvalidation(service: CacheInvalidationService): void {
    this.cacheInvalidation = service;
  }

  // Commands
  async create(input: CreateTaskInput): Promise<Task> {
    const task = await this.createTaskCommand.execute(input);
    await this.cacheInvalidation?.publishTaskCreated(
      input.orgId,
      task.id,
      task.projectId
    );
    return task;
  }

  async update(input: UpdateTaskInput): Promise<Task | undefined> {
    const task = await this.updateTaskCommand.execute(input);
    if (task) {
      await this.cacheInvalidation?.publishTaskUpdated(
        input.orgId,
        task.id,
        task.projectId
      );
    }
    return task;
  }

  async delete(input: DeleteTaskInput): Promise<Task | undefined> {
    const task = await this.deleteTaskCommand.execute(input);
    if (task) {
      await this.cacheInvalidation?.publishTaskDeleted(
        input.orgId,
        task.id,
        task.projectId
      );
    }
    return task;
  }

  async move(input: MoveTaskInput): Promise<Task | undefined> {
    const task = await this.moveTaskCommand.execute(input);
    if (task) {
      await this.cacheInvalidation?.publishTaskMoved(
        input.orgId,
        task.id,
        task.projectId
      );
    }
    return task;
  }

  async attachArtifact(input: AttachArtifactInput): Promise<boolean> {
    const result = await this.attachArtifactCommand.execute(input);
    if (result.success && result.projectId) {
      await this.cacheInvalidation?.publishTaskUpdated(
        input.orgId,
        input.taskId,
        result.projectId
      );
    }
    return result.success;
  }

  async detachArtifact(input: DetachArtifactInput): Promise<boolean> {
    const result = await this.detachArtifactCommand.execute(input);
    if (result.success && result.projectId) {
      await this.cacheInvalidation?.publishTaskUpdated(
        input.orgId,
        input.taskId,
        result.projectId
      );
    }
    return result.success;
  }

  // Queries
  getById(input: GetTaskByIdInput): Promise<GetTaskByIdResult> {
    return this.getTaskByIdQuery.execute(input);
  }

  listByProject(input: ListTasksInput): Promise<ListTasksByProjectResult> {
    return this.listTasksByProjectQuery.execute(input);
  }

  getByStatus(input: GetTasksByStatusInput): Promise<GetTasksByStatusResult> {
    return this.getTasksByStatusQuery.execute(input);
  }

  search(input: SearchTasksInput): Promise<SearchTasksResult> {
    return this.searchTasksQuery.execute(input);
  }

  // Stats
  getStats(input: GetTaskStatsInput): Promise<GetTaskStatsResult> {
    return this.getTaskStatsQuery.execute(input);
  }
}
