import type { db as DbType } from '../../db';
import type { GoogleDriveConnection, ArtifactDriveSync } from '../../db/schema';
import type { CacheInvalidationService } from '../../real-time';
import { GoogleOAuthService } from '../../integrations/google-drive';
import {
  ConnectGoogleDriveCommand,
  DisconnectGoogleDriveCommand,
  UpdateFolderCommand,
  QueueSyncCommand,
} from './commands';
import type {
  ConnectGoogleDriveInput,
  DisconnectGoogleDriveInput,
  UpdateFolderInput,
  QueueSyncInput,
} from './commands';
import {
  GetConnectionQuery,
  GetSyncStatusQuery,
  GetSyncStatsQuery,
} from './queries';
import type {
  GetConnectionInput,
  GetConnectionResult,
  GetSyncStatusInput,
  GetSyncStatsInput,
  SyncStats,
} from './queries';
import { SyncWorkerService } from './services';

/**
 * GoogleDriveFeature - provides Google Drive sync operations
 */
export class GoogleDriveFeature {
  private oauthService: GoogleOAuthService;
  private connectCommand: ConnectGoogleDriveCommand;
  private disconnectCommand: DisconnectGoogleDriveCommand;
  private updateFolderCommand: UpdateFolderCommand;
  private queueSyncCommand: QueueSyncCommand;
  private getConnectionQuery: GetConnectionQuery;
  private getSyncStatusQuery: GetSyncStatusQuery;
  private getSyncStatsQuery: GetSyncStatsQuery;
  private syncWorker: SyncWorkerService;
  private cacheInvalidation?: CacheInvalidationService;

  constructor(db: typeof DbType) {
    this.oauthService = new GoogleOAuthService();
    this.connectCommand = new ConnectGoogleDriveCommand(db, this.oauthService);
    this.disconnectCommand = new DisconnectGoogleDriveCommand(db);
    this.updateFolderCommand = new UpdateFolderCommand(db);
    this.queueSyncCommand = new QueueSyncCommand(db);
    this.getConnectionQuery = new GetConnectionQuery(db);
    this.getSyncStatusQuery = new GetSyncStatusQuery(db);
    this.getSyncStatsQuery = new GetSyncStatsQuery(db);
    this.syncWorker = new SyncWorkerService(db, this.oauthService);
  }

  setCacheInvalidation(service: CacheInvalidationService): void {
    this.cacheInvalidation = service;
  }

  /**
   * Check if Google Drive integration is configured
   */
  static isConfigured(): boolean {
    return GoogleOAuthService.isConfigured();
  }

  /**
   * Get the OAuth authorization URL
   */
  getAuthUrl(state: string): string {
    return this.oauthService.getAuthUrl(state);
  }

  // Commands

  async connect(input: ConnectGoogleDriveInput): Promise<GoogleDriveConnection> {
    const connection = await this.connectCommand.execute(input);
    // TODO: Publish cache invalidation
    return connection;
  }

  async disconnect(
    input: DisconnectGoogleDriveInput
  ): Promise<GoogleDriveConnection | undefined> {
    const connection = await this.disconnectCommand.execute(input);
    // TODO: Publish cache invalidation
    return connection;
  }

  async updateFolder(
    input: UpdateFolderInput
  ): Promise<GoogleDriveConnection | undefined> {
    const connection = await this.updateFolderCommand.execute(input);
    // TODO: Publish cache invalidation
    return connection;
  }

  async queueSync(input: QueueSyncInput): Promise<ArtifactDriveSync | null> {
    return this.queueSyncCommand.execute(input);
  }

  /**
   * Queue sync for an artifact if the user has an active connection
   * This is a convenience method for the ArtifactsFeature to call
   */
  async queueSyncIfConnected(input: {
    artifactId: string;
    userId: string;
    orgId: string;
    action: 'create' | 'update';
  }): Promise<void> {
    await this.queueSyncCommand.execute({
      artifactId: input.artifactId,
      userId: input.userId,
      orgId: input.orgId,
    });
  }

  // Queries

  getConnection(input: GetConnectionInput): Promise<GetConnectionResult> {
    return this.getConnectionQuery.execute(input);
  }

  getSyncStatus(input: GetSyncStatusInput): Promise<ArtifactDriveSync | undefined> {
    return this.getSyncStatusQuery.execute(input);
  }

  getSyncStats(input: GetSyncStatsInput): Promise<SyncStats> {
    return this.getSyncStatsQuery.execute(input);
  }

  // Worker operations

  /**
   * Process pending sync jobs
   */
  processPendingJobs(): Promise<number> {
    return this.syncWorker.processPendingJobs();
  }

  /**
   * Sync all artifacts for a user/org
   */
  syncAllArtifacts(userId: string, orgId: string): Promise<number> {
    return this.syncWorker.syncAllArtifacts(userId, orgId);
  }
}
