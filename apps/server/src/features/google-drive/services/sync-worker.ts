import { eq, and, inArray } from 'drizzle-orm';
import { createHash } from 'crypto';
import type { db as DbType } from '../../../db';
import {
  googleDriveConnections,
  artifactDriveSync,
  artifacts,
  type SyncStatus,
} from '../../../db/schema';
import { GoogleOAuthService } from '../../../integrations/google-drive';
import { DriveApiService, DriveApiError } from './drive-api-service';

const MAX_RETRIES = 5;
const BATCH_SIZE = 10;

interface SyncJob {
  syncId: string;
  artifactId: string;
  connectionId: string;
  driveFileId: string | null;
}

/**
 * Worker service for processing Google Drive sync jobs
 */
export class SyncWorkerService {
  private db: typeof DbType;
  private oauthService: GoogleOAuthService;
  private driveApiService: DriveApiService;
  private isProcessing = false;

  constructor(db: typeof DbType, oauthService: GoogleOAuthService) {
    this.db = db;
    this.oauthService = oauthService;
    this.driveApiService = new DriveApiService();
  }

  /**
   * Process pending sync jobs
   * Returns the number of jobs processed
   */
  async processPendingJobs(): Promise<number> {
    if (this.isProcessing) {
      return 0;
    }

    this.isProcessing = true;
    let processedCount = 0;

    try {
      // Get batch of pending jobs
      const pendingJobs = await this.db
        .select({
          syncId: artifactDriveSync.id,
          artifactId: artifactDriveSync.artifactId,
          connectionId: artifactDriveSync.connectionId,
          driveFileId: artifactDriveSync.driveFileId,
        })
        .from(artifactDriveSync)
        .where(eq(artifactDriveSync.syncStatus, 'pending'))
        .limit(BATCH_SIZE);

      for (const job of pendingJobs) {
        await this.processJob(job);
        processedCount++;
      }
    } finally {
      this.isProcessing = false;
    }

    return processedCount;
  }

  /**
   * Process a single sync job
   */
  private async processJob(job: SyncJob): Promise<void> {
    const { syncId, artifactId, connectionId, driveFileId } = job;

    try {
      // Mark as syncing
      await this.updateSyncStatus(syncId, 'syncing');

      // Get connection and artifact
      const [connection] = await this.db
        .select()
        .from(googleDriveConnections)
        .where(eq(googleDriveConnections.id, connectionId))
        .limit(1);

      if (!connection || !connection.isActive || !connection.folderId) {
        await this.updateSyncStatus(
          syncId,
          'error',
          'Connection not configured'
        );
        return;
      }

      const [artifact] = await this.db
        .select()
        .from(artifacts)
        .where(eq(artifacts.id, artifactId))
        .limit(1);

      if (!artifact) {
        await this.updateSyncStatus(syncId, 'error', 'Artifact not found');
        return;
      }

      // Get valid access token (refresh if needed)
      const accessToken = await this.getValidAccessToken(connection);

      // Calculate content hash
      const contentHash = this.hashContent(artifact.content);

      // Sync to Drive
      const fileName = `${artifact.title}.md`;

      let newDriveFileId: string;

      if (driveFileId) {
        // Update existing file
        const file = await this.driveApiService.updateFile(
          accessToken,
          driveFileId,
          artifact.content
        );
        newDriveFileId = file.id;

        // Update file name if changed
        if (file.name !== fileName) {
          await this.driveApiService.updateFileMetadata(
            accessToken,
            driveFileId,
            {
              name: fileName,
            }
          );
        }
      } else {
        // Create new file
        const file = await this.driveApiService.createFile(
          accessToken,
          connection.folderId,
          fileName,
          artifact.content
        );
        newDriveFileId = file.id;
      }

      // Update sync record as successful
      await this.db
        .update(artifactDriveSync)
        .set({
          syncStatus: 'synced',
          driveFileId: newDriveFileId,
          contentHash,
          lastSyncedAt: new Date(),
          lastError: null,
          retryCount: 0,
          updatedAt: new Date(),
        })
        .where(eq(artifactDriveSync.id, syncId));
    } catch (error) {
      await this.handleSyncError(syncId, error);
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  private async getValidAccessToken(
    connection: typeof googleDriveConnections.$inferSelect
  ): Promise<string> {
    // Check if token is expired or about to expire
    if (this.oauthService.isTokenExpired(connection.tokenExpiresAt)) {
      // Refresh the token
      const refreshToken = this.oauthService.decryptToken(
        connection.refreshTokenEncrypted
      );
      const { accessToken, expiresAt } =
        await this.oauthService.refreshAccessToken(refreshToken);

      // Update stored tokens
      const encryptedAccessToken = this.oauthService.encryptToken(accessToken);
      await this.db
        .update(googleDriveConnections)
        .set({
          accessTokenEncrypted: encryptedAccessToken,
          tokenExpiresAt: expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(googleDriveConnections.id, connection.id));

      return accessToken;
    }

    // Return existing token
    return this.oauthService.decryptToken(connection.accessTokenEncrypted);
  }

  /**
   * Handle sync errors with retry logic
   */
  private async handleSyncError(syncId: string, error: unknown): Promise<void> {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const isRetryable =
      error instanceof DriveApiError ? error.isRetryable : true;

    // Get current retry count
    const [sync] = await this.db
      .select({ retryCount: artifactDriveSync.retryCount })
      .from(artifactDriveSync)
      .where(eq(artifactDriveSync.id, syncId))
      .limit(1);

    const retryCount = (sync?.retryCount ?? 0) + 1;

    if (isRetryable && retryCount < MAX_RETRIES) {
      // Mark as pending for retry
      await this.db
        .update(artifactDriveSync)
        .set({
          syncStatus: 'pending',
          lastError: errorMessage,
          retryCount,
          updatedAt: new Date(),
        })
        .where(eq(artifactDriveSync.id, syncId));
    } else {
      // Mark as permanently failed
      const status: SyncStatus = isRetryable ? 'failed' : 'error';
      await this.db
        .update(artifactDriveSync)
        .set({
          syncStatus: status,
          lastError: errorMessage,
          retryCount,
          updatedAt: new Date(),
        })
        .where(eq(artifactDriveSync.id, syncId));
    }
  }

  /**
   * Update sync status
   */
  private async updateSyncStatus(
    syncId: string,
    status: SyncStatus,
    error?: string
  ): Promise<void> {
    await this.db
      .update(artifactDriveSync)
      .set({
        syncStatus: status,
        lastError: error ?? null,
        updatedAt: new Date(),
      })
      .where(eq(artifactDriveSync.id, syncId));
  }

  /**
   * Hash content for change detection
   */
  private hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Sync all artifacts for a user/org
   */
  async syncAllArtifacts(userId: string, orgId: string): Promise<number> {
    // Get connection
    const [connection] = await this.db
      .select()
      .from(googleDriveConnections)
      .where(
        and(
          eq(googleDriveConnections.userId, userId),
          eq(googleDriveConnections.orgId, orgId),
          eq(googleDriveConnections.isActive, true)
        )
      )
      .limit(1);

    if (!connection || !connection.folderId) {
      return 0;
    }

    // Get all artifacts for this user/org
    const userArtifacts = await this.db
      .select({ id: artifacts.id })
      .from(artifacts)
      .where(and(eq(artifacts.userId, userId), eq(artifacts.orgId, orgId)));

    if (userArtifacts.length === 0) {
      return 0;
    }

    const artifactIds = userArtifacts.map((a) => a.id);

    // Get existing sync records
    const existingSyncs = await this.db
      .select({ artifactId: artifactDriveSync.artifactId })
      .from(artifactDriveSync)
      .where(eq(artifactDriveSync.connectionId, connection.id));

    const existingArtifactIds = new Set(existingSyncs.map((s) => s.artifactId));

    // Create sync records for new artifacts
    const newArtifactIds = artifactIds.filter(
      (id) => !existingArtifactIds.has(id)
    );

    if (newArtifactIds.length > 0) {
      await this.db.insert(artifactDriveSync).values(
        newArtifactIds.map((artifactId) => ({
          artifactId,
          connectionId: connection.id,
          syncStatus: 'pending' as const,
        }))
      );
    }

    // Mark existing syncs as pending
    if (existingSyncs.length > 0) {
      await this.db
        .update(artifactDriveSync)
        .set({
          syncStatus: 'pending',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(artifactDriveSync.connectionId, connection.id),
            inArray(
              artifactDriveSync.artifactId,
              existingSyncs.map((s) => s.artifactId)
            )
          )
        );
    }

    return artifactIds.length;
  }
}
