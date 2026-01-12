import type { db as DbType } from '../../db';
import type { Artifact } from '../../db/schema';
import type { CacheInvalidationService } from '../../real-time';
import {
  CreateArtifactCommand,
  DeleteArtifactCommand,
  UpdateArtifactCommand,
  PatchArtifactCommand,
} from './commands';
import type {
  CreateArtifactInput,
  DeleteArtifactInput,
  UpdateArtifactInput,
  PatchArtifactInput,
} from './commands';
import {
  GetArtifactByIdQuery,
  ListArtifactsQuery,
  SearchArtifactsQuery,
  GetArtifactsStatsQuery,
  GetArtifactsOverTimeQuery,
  GetArtifactsByAgentQuery,
} from './queries';
import type {
  GetArtifactByIdInput,
  GetArtifactByIdResult,
  ListArtifactsInput,
  ListArtifactsResult,
  SearchArtifactsInput,
  SearchArtifactsResult,
  GetArtifactsStatsInput,
  GetArtifactsStatsResult,
  GetArtifactsOverTimeInput,
  GetArtifactsOverTimeResult,
  GetArtifactsByAgentInput,
  GetArtifactsByAgentResult,
} from './queries';

/**
 * ArtifactsFeature - provides artifact CRUD and analytics operations
 */
export class ArtifactsFeature {
  private createArtifactCommand: CreateArtifactCommand;
  private deleteArtifactCommand: DeleteArtifactCommand;
  private updateArtifactCommand: UpdateArtifactCommand;
  private patchArtifactCommand: PatchArtifactCommand;
  private getArtifactByIdQuery: GetArtifactByIdQuery;
  private listArtifactsQuery: ListArtifactsQuery;
  private searchArtifactsQuery: SearchArtifactsQuery;
  private getArtifactsStatsQuery: GetArtifactsStatsQuery;
  private getArtifactsOverTimeQuery: GetArtifactsOverTimeQuery;
  private getArtifactsByAgentQuery: GetArtifactsByAgentQuery;
  private cacheInvalidation?: CacheInvalidationService;

  constructor(db: typeof DbType, agentNames: Map<string, string>) {
    this.createArtifactCommand = new CreateArtifactCommand(db);
    this.deleteArtifactCommand = new DeleteArtifactCommand(db);
    this.updateArtifactCommand = new UpdateArtifactCommand(db);
    this.patchArtifactCommand = new PatchArtifactCommand(db);
    this.getArtifactByIdQuery = new GetArtifactByIdQuery(db);
    this.listArtifactsQuery = new ListArtifactsQuery(db);
    this.searchArtifactsQuery = new SearchArtifactsQuery(db);
    this.getArtifactsStatsQuery = new GetArtifactsStatsQuery(db);
    this.getArtifactsOverTimeQuery = new GetArtifactsOverTimeQuery(db);
    this.getArtifactsByAgentQuery = new GetArtifactsByAgentQuery(
      db,
      agentNames
    );
  }

  setCacheInvalidation(service: CacheInvalidationService): void {
    this.cacheInvalidation = service;
  }

  // Commands
  async create(input: CreateArtifactInput): Promise<Artifact> {
    const artifact = await this.createArtifactCommand.execute(input);
    await this.cacheInvalidation?.publishArtifactCreated(
      input.userId,
      artifact.id,
      input.agentId
    );
    return artifact;
  }

  async delete(input: DeleteArtifactInput): Promise<Artifact | undefined> {
    const artifact = await this.deleteArtifactCommand.execute(input);
    if (artifact) {
      await this.cacheInvalidation?.publishArtifactDeleted(
        input.userId,
        artifact.id
      );
    }
    return artifact;
  }

  async update(input: UpdateArtifactInput): Promise<Artifact | undefined> {
    const artifact = await this.updateArtifactCommand.execute(input);
    if (artifact) {
      await this.cacheInvalidation?.publishArtifactUpdated(
        input.userId,
        artifact.id
      );
    }
    return artifact;
  }

  async patch(input: PatchArtifactInput): Promise<Artifact | undefined> {
    const artifact = await this.patchArtifactCommand.execute(input);
    if (artifact) {
      await this.cacheInvalidation?.publishArtifactUpdated(
        input.userId,
        artifact.id
      );
    }
    return artifact;
  }

  // Queries
  getById(input: GetArtifactByIdInput): Promise<GetArtifactByIdResult> {
    return this.getArtifactByIdQuery.execute(input);
  }

  list(input: ListArtifactsInput): Promise<ListArtifactsResult> {
    return this.listArtifactsQuery.execute(input);
  }

  search(input: SearchArtifactsInput): Promise<SearchArtifactsResult> {
    return this.searchArtifactsQuery.execute(input);
  }

  // Analytics
  getStats(input: GetArtifactsStatsInput): Promise<GetArtifactsStatsResult> {
    return this.getArtifactsStatsQuery.execute(input);
  }

  getOverTime(
    input: GetArtifactsOverTimeInput
  ): Promise<GetArtifactsOverTimeResult> {
    return this.getArtifactsOverTimeQuery.execute(input);
  }

  getByAgent(
    input: GetArtifactsByAgentInput
  ): Promise<GetArtifactsByAgentResult> {
    return this.getArtifactsByAgentQuery.execute(input);
  }
}
