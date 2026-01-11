import type { db as DbType } from '../../db';
import type { Project } from '../../db/schema';
import type { CacheInvalidationService } from '../../real-time';
import {
  CreateProjectCommand,
  UpdateProjectCommand,
  DeleteProjectCommand,
  AttachArtifactToProjectCommand,
  DetachArtifactFromProjectCommand,
} from './commands';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  DeleteProjectInput,
  AttachArtifactToProjectInput,
  DetachArtifactFromProjectInput,
} from './commands';
import {
  GetProjectByIdQuery,
  ListProjectsQuery,
  SearchProjectsQuery,
  GetProjectStatsQuery,
  ListProjectArtifactsQuery,
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
  ListProjectArtifactsInput,
  ListProjectArtifactsResult,
} from './queries';

/**
 * ProjectsFeature - provides project CRUD and query operations
 */
export class ProjectsFeature {
  private createProjectCommand: CreateProjectCommand;
  private updateProjectCommand: UpdateProjectCommand;
  private deleteProjectCommand: DeleteProjectCommand;
  private attachArtifactCommand: AttachArtifactToProjectCommand;
  private detachArtifactCommand: DetachArtifactFromProjectCommand;
  private getProjectByIdQuery: GetProjectByIdQuery;
  private listProjectsQuery: ListProjectsQuery;
  private searchProjectsQuery: SearchProjectsQuery;
  private getProjectStatsQuery: GetProjectStatsQuery;
  private listProjectArtifactsQuery: ListProjectArtifactsQuery;
  private cacheInvalidation?: CacheInvalidationService;

  constructor(db: typeof DbType) {
    this.createProjectCommand = new CreateProjectCommand(db);
    this.updateProjectCommand = new UpdateProjectCommand(db);
    this.deleteProjectCommand = new DeleteProjectCommand(db);
    this.attachArtifactCommand = new AttachArtifactToProjectCommand(db);
    this.detachArtifactCommand = new DetachArtifactFromProjectCommand(db);
    this.getProjectByIdQuery = new GetProjectByIdQuery(db);
    this.listProjectsQuery = new ListProjectsQuery(db);
    this.searchProjectsQuery = new SearchProjectsQuery(db);
    this.getProjectStatsQuery = new GetProjectStatsQuery(db);
    this.listProjectArtifactsQuery = new ListProjectArtifactsQuery(db);
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
      await this.cacheInvalidation?.publishProjectDeleted(
        input.orgId,
        project.id
      );
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

  // Artifacts
  async attachArtifact(
    input: AttachArtifactToProjectInput
  ): Promise<{ success: boolean; alreadyAttached: boolean }> {
    const result = await this.attachArtifactCommand.execute(input);
    if (result.success && !result.alreadyAttached) {
      await this.cacheInvalidation?.publishProjectUpdated(
        input.orgId,
        input.projectId
      );
    }
    return result;
  }

  async detachArtifact(
    input: DetachArtifactFromProjectInput
  ): Promise<{ success: boolean; wasAttached: boolean }> {
    const result = await this.detachArtifactCommand.execute(input);
    if (result.success && result.wasAttached) {
      await this.cacheInvalidation?.publishProjectUpdated(
        input.orgId,
        input.projectId
      );
    }
    return result;
  }

  listArtifacts(
    input: ListProjectArtifactsInput
  ): Promise<ListProjectArtifactsResult> {
    return this.listProjectArtifactsQuery.execute(input);
  }
}
