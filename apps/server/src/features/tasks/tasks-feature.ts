import type { db as DbType } from '../../db';
import type { Task } from '../../db/schema';
import type { CacheInvalidationService } from '../../lib/redis/cache-invalidation-service';
import {
  CreateTaskCommand,
  UpdateTaskCommand,
  DeleteTaskCommand,
  MoveTaskCommand,
  AttachArtifactCommand,
  DetachArtifactCommand,
} from './commands';
import {
  GetTaskByIdQuery,
  ListTasksByProjectQuery,
  GetTasksByStatusQuery,
  SearchTasksQuery,
  GetTaskStatsQuery,
} from './queries';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  ListTasksInput,
  SearchTasksInput,
  TaskListItem,
  TaskWithDetails,
  TasksByStatus,
  TaskStats,
} from './types';

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

  async delete(
    id: string,
    userId: string,
    orgId: string
  ): Promise<Task | undefined> {
    const task = await this.deleteTaskCommand.execute(id, userId, orgId);
    if (task) {
      await this.cacheInvalidation?.publishTaskDeleted(
        orgId,
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

  async attachArtifact(
    taskId: string,
    artifactId: string,
    userId: string,
    orgId: string
  ): Promise<boolean> {
    const result = await this.attachArtifactCommand.execute(
      taskId,
      artifactId,
      userId,
      orgId
    );
    if (result.success && result.projectId) {
      await this.cacheInvalidation?.publishTaskUpdated(
        orgId,
        taskId,
        result.projectId
      );
    }
    return result.success;
  }

  async detachArtifact(
    taskId: string,
    artifactId: string,
    userId: string,
    orgId: string
  ): Promise<boolean> {
    const result = await this.detachArtifactCommand.execute(
      taskId,
      artifactId,
      userId,
      orgId
    );
    if (result.success && result.projectId) {
      await this.cacheInvalidation?.publishTaskUpdated(
        orgId,
        taskId,
        result.projectId
      );
    }
    return result.success;
  }

  // Queries
  getById(
    id: string,
    userId: string,
    orgId: string
  ): Promise<TaskWithDetails | undefined> {
    return this.getTaskByIdQuery.execute(id, userId, orgId);
  }

  listByProject(input: ListTasksInput): Promise<TaskListItem[]> {
    return this.listTasksByProjectQuery.execute(input);
  }

  getByStatus(
    projectId: string,
    userId: string,
    orgId: string
  ): Promise<TasksByStatus> {
    return this.getTasksByStatusQuery.execute(projectId, userId, orgId);
  }

  search(input: SearchTasksInput): Promise<TaskListItem[]> {
    return this.searchTasksQuery.execute(input);
  }

  // Stats
  getStats(orgId: string): Promise<TaskStats> {
    return this.getTaskStatsQuery.execute(orgId);
  }
}
