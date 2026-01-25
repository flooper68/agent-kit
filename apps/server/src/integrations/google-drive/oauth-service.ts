import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from '../../env';

// OAuth configuration
const OAUTH_SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const USER_INFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | null;
}

export interface GoogleUserInfo {
  email: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface UserInfoResponse {
  email: string;
}

/**
 * Service for handling Google OAuth flow and token encryption
 */
export class GoogleOAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private encryptionKey: Buffer | null;

  constructor() {
    if (!env.GOOGLE_OAUTH_CLIENT_ID) {
      throw new Error('GOOGLE_OAUTH_CLIENT_ID is not configured');
    }
    if (!env.GOOGLE_OAUTH_CLIENT_SECRET) {
      throw new Error('GOOGLE_OAUTH_CLIENT_SECRET is not configured');
    }
    if (!env.GOOGLE_OAUTH_REDIRECT_URI) {
      throw new Error('GOOGLE_OAUTH_REDIRECT_URI is not configured');
    }

    this.clientId = env.GOOGLE_OAUTH_CLIENT_ID;
    this.clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET;
    this.redirectUri = env.GOOGLE_OAUTH_REDIRECT_URI;
    this.encryptionKey = env.ENCRYPTION_KEY
      ? Buffer.from(env.ENCRYPTION_KEY, 'utf-8')
      : null;
  }

  /**
   * Check if Google Drive integration is configured
   */
  static isConfigured(): boolean {
    return !!(
      env.GOOGLE_OAUTH_CLIENT_ID &&
      env.GOOGLE_OAUTH_CLIENT_SECRET &&
      env.GOOGLE_OAUTH_REDIRECT_URI &&
      env.ENCRYPTION_KEY
    );
  }

  /**
   * Generate the OAuth authorization URL
   */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: OAUTH_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent', // Force consent to ensure refresh token
      state,
    });

    return `${AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for tokens: ${error}`);
    }

    const data = (await response.json()) as TokenResponse;

    if (!data.refresh_token) {
      throw new Error(
        'No refresh token received. User may need to revoke app access and reconnect.'
      );
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : null,
    };
  }

  /**
   * Refresh an access token using a refresh token
   */
  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string; expiresAt: Date | null }> {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh access token: ${error}`);
    }

    const data = (await response.json()) as TokenResponse;

    return {
      accessToken: data.access_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : null,
    };
  }

  /**
   * Get user info (email) from access token
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch(USER_INFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get user info: ${error}`);
    }

    const data = (await response.json()) as UserInfoResponse;

    return {
      email: data.email,
    };
  }

  /**
   * Encrypt a token for secure storage
   * Uses AES-256-GCM for authenticated encryption
   */
  encryptToken(token: string): string {
    if (!this.encryptionKey) {
      throw new Error('ENCRYPTION_KEY is not configured');
    }

    // Generate a random 12-byte IV for GCM
    const iv = randomBytes(12);

    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get the authentication tag
    const authTag = cipher.getAuthTag();

    // Combine IV + auth tag + encrypted data
    // Format: iv(24 hex) + authTag(32 hex) + ciphertext
    return iv.toString('hex') + authTag.toString('hex') + encrypted;
  }

  /**
   * Decrypt a token from storage
   */
  decryptToken(encryptedToken: string): string {
    if (!this.encryptionKey) {
      throw new Error('ENCRYPTION_KEY is not configured');
    }

    // Extract IV (12 bytes = 24 hex chars)
    const iv = Buffer.from(encryptedToken.slice(0, 24), 'hex');
    // Extract auth tag (16 bytes = 32 hex chars)
    const authTag = Buffer.from(encryptedToken.slice(24, 56), 'hex');
    // Extract ciphertext
    const encrypted = encryptedToken.slice(56);

    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Check if an access token is expired or about to expire
   * Returns true if token expires within 5 minutes
   */
  isTokenExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) {
      return false; // No expiration info, assume valid
    }

    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return expiresAt <= fiveMinutesFromNow;
  }
}
