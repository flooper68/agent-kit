import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  googleDriveConnections,
  type GoogleDriveConnection,
} from '../../../db/schema';
import {
  GoogleOAuthService,
  type OAuthTokens,
} from '../../../integrations/google-drive';

export interface ConnectGoogleDriveInput {
  userId: string;
  orgId: string;
  code: string;
}

export type ConnectGoogleDriveResult = GoogleDriveConnection;

export class ConnectGoogleDriveCommand {
  private db: typeof DbType;
  private oauthService: GoogleOAuthService;

  constructor(db: typeof DbType, oauthService: GoogleOAuthService) {
    this.db = db;
    this.oauthService = oauthService;
  }

  async execute(
    input: ConnectGoogleDriveInput
  ): Promise<ConnectGoogleDriveResult> {
    const { userId, orgId, code } = input;

    // Exchange code for tokens
    const tokens: OAuthTokens =
      await this.oauthService.exchangeCodeForTokens(code);

    // Get user email
    const userInfo = await this.oauthService.getUserInfo(tokens.accessToken);

    // Encrypt tokens for storage
    const accessTokenEncrypted = this.oauthService.encryptToken(
      tokens.accessToken
    );
    const refreshTokenEncrypted = this.oauthService.encryptToken(
      tokens.refreshToken
    );

    // Check if connection already exists
    const [existing] = await this.db
      .select()
      .from(googleDriveConnections)
      .where(
        and(
          eq(googleDriveConnections.userId, userId),
          eq(googleDriveConnections.orgId, orgId)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing connection
      const [updated] = await this.db
        .update(googleDriveConnections)
        .set({
          googleEmail: userInfo.email,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          tokenExpiresAt: tokens.expiresAt,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(googleDriveConnections.id, existing.id))
        .returning();

      if (!updated) {
        throw new Error('Failed to update connection');
      }

      return updated;
    }

    // Create new connection
    const [connection] = await this.db
      .insert(googleDriveConnections)
      .values({
        userId,
        orgId,
        googleEmail: userInfo.email,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        tokenExpiresAt: tokens.expiresAt,
        isActive: true,
      })
      .returning();

    if (!connection) {
      throw new Error('Failed to create connection');
    }

    return connection;
  }
}
