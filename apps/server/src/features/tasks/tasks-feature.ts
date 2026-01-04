import type { db as DbType } from '../../db';
import type { Task } from '../../db/schema';
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

  // Commands
  create(input: CreateTaskInput): Promise<Task> {
    return this.createTaskCommand.execute(input);
  }

  update(input: UpdateTaskInput): Promise<Task | undefined> {
    return this.updateTaskCommand.execute(input);
  }

  delete(id: string, userId: string, orgId: string): Promise<Task | undefined> {
    return this.deleteTaskCommand.execute(id, userId, orgId);
  }

  move(input: MoveTaskInput): Promise<Task | undefined> {
    return this.moveTaskCommand.execute(input);
  }

  attachArtifact(
    taskId: string,
    artifactId: string,
    userId: string,
    orgId: string
  ): Promise<boolean> {
    return this.attachArtifactCommand.execute(
      taskId,
      artifactId,
      userId,
      orgId
    );
  }

  detachArtifact(
    taskId: string,
    artifactId: string,
    userId: string,
    orgId: string
  ): Promise<boolean> {
    return this.detachArtifactCommand.execute(
      taskId,
      artifactId,
      userId,
      orgId
    );
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
