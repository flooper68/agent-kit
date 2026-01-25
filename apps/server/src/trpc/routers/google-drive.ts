import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, orgProcedure } from '../trpc';

export const googleDriveRouter = router({
  /**
   * Check if Google Drive integration is configured
   */
  isConfigured: orgProcedure.query(({ ctx }) => {
    if (!ctx.googleDriveFeature) {
      return { configured: false };
    }
    return { configured: true };
  }),

  /**
   * Get the OAuth authorization URL
   */
  getAuthUrl: orgProcedure.query(({ ctx }) => {
    if (!ctx.googleDriveFeature) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Google Drive integration is not configured',
      });
    }

    // Generate state parameter with user/org context
    const state = Buffer.from(
      JSON.stringify({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        timestamp: Date.now(),
      })
    ).toString('base64url');

    return {
      url: ctx.googleDriveFeature.getAuthUrl(state),
      state,
    };
  }),

  /**
   * Handle OAuth callback - exchange code for tokens
   */
  handleCallback: orgProcedure
    .input(
      z.object({
        code: z.string().min(1),
        state: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.googleDriveFeature) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Google Drive integration is not configured',
        });
      }

      // Verify state parameter
      try {
        const stateData = JSON.parse(
          Buffer.from(input.state, 'base64url').toString()
        ) as { userId: string; orgId: string; timestamp: number };

        // Check state belongs to current user/org
        if (
          stateData.userId !== ctx.auth.userId ||
          stateData.orgId !== ctx.auth.orgId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Invalid OAuth state',
          });
        }

        // Check state is not too old (5 minutes)
        if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'OAuth state expired',
          });
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid OAuth state',
        });
      }

      const connection = await ctx.googleDriveFeature.connect({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        code: input.code,
      });

      return {
        id: connection.id,
        googleEmail: connection.googleEmail,
        folderId: connection.folderId,
        folderName: connection.folderName,
        isActive: connection.isActive,
      };
    }),

  /**
   * Get current connection status
   */
  getConnection: orgProcedure.query(async ({ ctx }) => {
    if (!ctx.googleDriveFeature) {
      return null;
    }

    const connection = await ctx.googleDriveFeature.getConnection({
      userId: ctx.auth.userId,
      orgId: ctx.auth.orgId,
    });

    if (!connection) {
      return null;
    }

    return {
      id: connection.id,
      googleEmail: connection.googleEmail,
      folderId: connection.folderId,
      folderName: connection.folderName,
      isActive: connection.isActive,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  }),

  /**
   * Disconnect Google Drive
   */
  disconnect: orgProcedure.mutation(async ({ ctx }) => {
    if (!ctx.googleDriveFeature) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Google Drive integration is not configured',
      });
    }

    const connection = await ctx.googleDriveFeature.disconnect({
      userId: ctx.auth.userId,
      orgId: ctx.auth.orgId,
    });

    if (!connection) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No connection found',
      });
    }

    return { success: true };
  }),

  /**
   * Update the sync folder
   */
  updateFolder: orgProcedure
    .input(
      z.object({
        folderId: z.string().min(1),
        folderName: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.googleDriveFeature) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Google Drive integration is not configured',
        });
      }

      const connection = await ctx.googleDriveFeature.updateFolder({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        folderId: input.folderId,
        folderName: input.folderName,
      });

      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No connection found',
        });
      }

      return {
        id: connection.id,
        folderId: connection.folderId,
        folderName: connection.folderName,
      };
    }),

  /**
   * Sync a single artifact
   */
  syncArtifact: orgProcedure
    .input(z.object({ artifactId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.googleDriveFeature) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Google Drive integration is not configured',
        });
      }

      const syncRecord = await ctx.googleDriveFeature.queueSync({
        artifactId: input.artifactId,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
      });

      if (!syncRecord) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No active connection with folder configured',
        });
      }

      return {
        id: syncRecord.id,
        syncStatus: syncRecord.syncStatus,
      };
    }),

  /**
   * Sync all artifacts
   */
  syncAllArtifacts: orgProcedure.mutation(async ({ ctx }) => {
    if (!ctx.googleDriveFeature) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Google Drive integration is not configured',
      });
    }

    const count = await ctx.googleDriveFeature.syncAllArtifacts(
      ctx.auth.userId,
      ctx.auth.orgId
    );

    return { queuedCount: count };
  }),

  /**
   * Get sync status for an artifact
   */
  getSyncStatus: orgProcedure
    .input(z.object({ artifactId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.googleDriveFeature) {
        return null;
      }

      const syncStatus = await ctx.googleDriveFeature.getSyncStatus({
        artifactId: input.artifactId,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
      });

      if (!syncStatus) {
        return null;
      }

      return {
        id: syncStatus.id,
        syncStatus: syncStatus.syncStatus,
        driveFileId: syncStatus.driveFileId,
        lastSyncedAt: syncStatus.lastSyncedAt,
        lastError: syncStatus.lastError,
      };
    }),

  /**
   * Get sync statistics
   */
  getSyncStats: orgProcedure.query(async ({ ctx }) => {
    if (!ctx.googleDriveFeature) {
      return null;
    }

    return ctx.googleDriveFeature.getSyncStats({
      userId: ctx.auth.userId,
      orgId: ctx.auth.orgId,
    });
  }),
});
