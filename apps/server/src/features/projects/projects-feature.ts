import type { db as DbType } from '../../db';
import type { Project } from '../../db/schema';
import type { CacheInvalidationService } from '../../lib/redis/cache-invalidation-service';
import {
  CreateProjectCommand,
  UpdateProjectCommand,
  DeleteProjectCommand,
} from './commands';
import {
  GetProjectByIdQuery,
  ListProjectsQuery,
  SearchProjectsQuery,
  GetProjectStatsQuery,
} from './queries';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectsInput,
  SearchProjectsInput,
  PaginatedProjects,
  ProjectWithTasks,
  ProjectListItem,
  ProjectStats,
} from './types';

/**
 * ProjectsFeature - provides project CRUD and query operations
 */
export class ProjectsFeature {
  private createProjectCommand: CreateProjectCommand;
  private updateProjectCommand: UpdateProjectCommand;
  private deleteProjectCommand: DeleteProjectCommand;
  private getProjectByIdQuery: GetProjectByIdQuery;
  private listProjectsQuery: ListProjectsQuery;
  private searchProjectsQuery: SearchProjectsQuery;
  private getProjectStatsQuery: GetProjectStatsQuery;
  private cacheInvalidation?: CacheInvalidationService;

  constructor(db: typeof DbType) {
    this.createProjectCommand = new CreateProjectCommand(db);
    this.updateProjectCommand = new UpdateProjectCommand(db);
    this.deleteProjectCommand = new DeleteProjectCommand(db);
    this.getProjectByIdQuery = new GetProjectByIdQuery(db);
    this.listProjectsQuery = new ListProjectsQuery(db);
    this.searchProjectsQuery = new SearchProjectsQuery(db);
    this.getProjectStatsQuery = new GetProjectStatsQuery(db);
  }

  setCacheInvalidation(service: CacheInvalidationService): void {
    this.cacheInvalidation = service;
  }

  // Commands
  async create(input: CreateProjectInput): Promise<Project> {
    const project = await this.createProjectCommand.execute(input);
    await this.cacheInvalidation?.publishProjectCreated(
      input.orgId,
      project.id
    );
    return project;
  }

  async update(input: UpdateProjectInput): Promise<Project | undefined> {
    const project = await this.updateProjectCommand.execute(input);
    if (project) {
      await this.cacheInvalidation?.publishProjectUpdated(
        input.orgId,
        project.id
      );
    }
    return project;
  }

  async delete(
    id: string,
    userId: string,
    orgId: string
  ): Promise<Project | undefined> {
    const project = await this.deleteProjectCommand.execute(id, userId, orgId);
    if (project) {
      await this.cacheInvalidation?.publishProjectDeleted(orgId, project.id);
    }
    return project;
  }

  // Queries
  getById(
    id: string,
    userId: string,
    orgId: string
  ): Promise<ProjectWithTasks | undefined> {
    return this.getProjectByIdQuery.execute(id, userId, orgId);
  }

  list(input: ListProjectsInput): Promise<PaginatedProjects> {
    return this.listProjectsQuery.execute(input);
  }

  search(input: SearchProjectsInput): Promise<ProjectListItem[]> {
    return this.searchProjectsQuery.execute(input);
  }

  // Stats
  getStats(orgId: string): Promise<ProjectStats> {
    return this.getProjectStatsQuery.execute(orgId);
  }
}
