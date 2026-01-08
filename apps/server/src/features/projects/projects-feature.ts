import type { db as DbType } from '../../db';
import type { Project } from '../../db/schema';
import type { CacheInvalidationService } from '../../real-time';
import {
  CreateProjectCommand,
  UpdateProjectCommand,
  DeleteProjectCommand,
} from './commands';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  DeleteProjectInput,
} from './commands';
import {
  GetProjectByIdQuery,
  ListProjectsQuery,
  SearchProjectsQuery,
  GetProjectStatsQuery,
} from './queries';
import type {
  GetProjectByIdInput,
  GetProjectByIdResult,
  ListProjectsInput,
  ListProjectsResult,
  SearchProjectsInput,
  SearchProjectsResult,
  GetProjectStatsInput,
  GetProjectStatsResult,
} from './queries';

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

  async delete(input: DeleteProjectInput): Promise<Project | undefined> {
    const project = await this.deleteProjectCommand.execute(input);
    if (project) {
      await this.cacheInvalidation?.publishProjectDeleted(input.orgId, project.id);
    }
    return project;
  }

  // Queries
  getById(input: GetProjectByIdInput): Promise<GetProjectByIdResult> {
    return this.getProjectByIdQuery.execute(input);
  }

  list(input: ListProjectsInput): Promise<ListProjectsResult> {
    return this.listProjectsQuery.execute(input);
  }

  search(input: SearchProjectsInput): Promise<SearchProjectsResult> {
    return this.searchProjectsQuery.execute(input);
  }

  // Stats
  getStats(input: GetProjectStatsInput): Promise<GetProjectStatsResult> {
    return this.getProjectStatsQuery.execute(input);
  }
}
