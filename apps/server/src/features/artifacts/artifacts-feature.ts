import type { db as DbType } from '../../db';
import type { Artifact } from '../../db/schema';
import { CreateArtifactCommand, DeleteArtifactCommand } from './commands';
import {
  GetArtifactByIdQuery,
  ListArtifactsQuery,
  SearchArtifactsQuery,
  GetArtifactsStatsQuery,
  GetArtifactsOverTimeQuery,
  GetArtifactsByAgentQuery,
} from './queries';
import type {
  CreateArtifactInput,
  ListArtifactsInput,
  SearchArtifactsInput,
  SearchArtifactsResult,
  TimeRange,
  PaginatedArtifacts,
  ArtifactStats,
  ArtifactsOverTimePoint,
  ArtifactsByAgent,
} from './types';

/**
 * ArtifactsFeature - provides artifact CRUD and analytics operations
 */
export class ArtifactsFeature {
  private createArtifactCommand: CreateArtifactCommand;
  private deleteArtifactCommand: DeleteArtifactCommand;
  private getArtifactByIdQuery: GetArtifactByIdQuery;
  private listArtifactsQuery: ListArtifactsQuery;
  private searchArtifactsQuery: SearchArtifactsQuery;
  private getArtifactsStatsQuery: GetArtifactsStatsQuery;
  private getArtifactsOverTimeQuery: GetArtifactsOverTimeQuery;
  private getArtifactsByAgentQuery: GetArtifactsByAgentQuery;

  constructor(db: typeof DbType, agentNames: Map<string, string>) {
    this.createArtifactCommand = new CreateArtifactCommand(db);
    this.deleteArtifactCommand = new DeleteArtifactCommand(db);
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

  // Commands
  create(input: CreateArtifactInput): Promise<Artifact> {
    return this.createArtifactCommand.execute(input);
  }

  delete(
    id: string,
    userId: string,
    orgId: string
  ): Promise<Artifact | undefined> {
    return this.deleteArtifactCommand.execute(id, userId, orgId);
  }

  // Queries
  getById(
    id: string,
    userId: string,
    orgId: string
  ): Promise<Artifact | undefined> {
    return this.getArtifactByIdQuery.execute(id, userId, orgId);
  }

  list(input: ListArtifactsInput): Promise<PaginatedArtifacts> {
    return this.listArtifactsQuery.execute(input);
  }

  search(input: SearchArtifactsInput): Promise<SearchArtifactsResult> {
    return this.searchArtifactsQuery.execute(input);
  }

  // Analytics
  getStats(orgId: string, timeRange: TimeRange): Promise<ArtifactStats> {
    return this.getArtifactsStatsQuery.execute(orgId, timeRange);
  }

  getOverTime(
    orgId: string,
    timeRange: TimeRange
  ): Promise<ArtifactsOverTimePoint[]> {
    return this.getArtifactsOverTimeQuery.execute(orgId, timeRange);
  }

  getByAgent(orgId: string, timeRange: TimeRange): Promise<ArtifactsByAgent[]> {
    return this.getArtifactsByAgentQuery.execute(orgId, timeRange);
  }
}
