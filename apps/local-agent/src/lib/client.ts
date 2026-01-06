import WebSocket from 'ws';
import { MessageHandler } from './message-handler';
import { EventBufferQueue } from './event-buffer-queue';
import { createLogger } from './logger';
import {
  deriveSharedSecret,
  generateNonce,
  computeHmac,
  verifyHmac,
  generateKeyPrefix,
  buildAgentHmacMessage,
  buildServerHmacMessage,
  validateConnectionSecurity,
  isTimestampValid,
  type ServerChallenge,
  type AuthSuccess,
  type AuthError,
} from '@agent-kit/auth';
import type { ClaudeCodeHandlerConfig } from './types';

const log = createLogger('Client');

export interface LocalAgentClientConfig {
  /** WebSocket server URL (ws:// or wss://) */
  serverUrl: string;
  /** Agent API key for authentication */
  agentApiKey: string;
  /** Optional agent ID for logging */
  agentId?: string;
  /** Handler type identifier (e.g., 'codebase-researcher') */
  handlerType: string;
  /** Handler configuration */
  handlerConfig: ClaudeCodeHandlerConfig;
}

interface PendingAuth {
  clientNonce: string;
  serverNonce: string;
  sharedSecret: string;
}

export class LocalAgentClient {
  private config: LocalAgentClientConfig;
  private ws: WebSocket | null = null;
  private messageHandler: MessageHandler | null = null;
  private eventBuffer: EventBufferQueue;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private isShuttingDown = false;
  private connectionStartTime: number = 0;
  private messageCount: number = 0;
  private isAuthenticated = false;
  private pendingAuth: PendingAuth | null = null;

  constructor(config: LocalAgentClientConfig) {
    this.config = config;
    // Event buffer persists across reconnections
    this.eventBuffer = new EventBufferQueue();
  }

  async connect(): Promise<void> {
    // Enforce WSS for non-localhost connections
    validateConnectionSecurity(this.config.serverUrl);

    const wsUrl = `${this.config.serverUrl}/agents`;
    this.connectionStartTime = Date.now();
    this.isAuthenticated = false;
    this.pendingAuth = null;

    log.info(`Initiating WebSocket connection`, {
      serverUrl: this.config.serverUrl,
      agentId: this.config.agentId ?? 'not-set',
      attempt: this.reconnectAttempts + 1,
    });

    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      const connectDuration = Date.now() - this.connectionStartTime;
      log.info(
        `WebSocket connection established, waiting for server challenge`,
        {
          durationMs: connectDuration,
          agentId: this.config.agentId,
        }
      );
      // Wait for server_challenge - don't send anything yet
    });

    this.ws.on('message', async (data) => {
      const dataStr = data.toString();

      // Handle authentication handshake
      if (!this.isAuthenticated) {
        try {
          const response = JSON.parse(dataStr) as
            | ServerChallenge
            | AuthSuccess
            | AuthError;

          // Step 1: Receive server challenge and respond with auth challenge
          if (response.type === 'server_challenge') {
            log.debug('Received server challenge, sending auth response');

            // Validate server's timestamp is within acceptable window (defense-in-depth)
            if (!isTimestampValid(response.timestamp)) {
              log.error(
                'Server challenge timestamp out of range - possible replay attack',
                { serverTimestamp: response.timestamp, now: Date.now() }
              );
              this.ws?.close(4002, 'Invalid challenge timestamp');
              return;
            }

            // Derive shared secret from API key
            const sharedSecret = deriveSharedSecret(this.config.agentApiKey);
            const clientNonce = generateNonce();
            const timestamp = Date.now();

            // Compute HMAC proving we know the secret
            const serverNonceHmac = computeHmac(
              sharedSecret,
              buildAgentHmacMessage(
                response.serverNonce,
                clientNonce,
                timestamp
              )
            );

            // Store for verification of server response
            this.pendingAuth = {
              clientNonce,
              serverNonce: response.serverNonce,
              sharedSecret,
            };

            // Send auth challenge
            this.ws!.send(
              JSON.stringify({
                type: 'auth_challenge',
                keyPrefix: generateKeyPrefix(this.config.agentApiKey),
                clientNonce,
                serverNonceHmac,
                timestamp,
              })
            );
            return;
          }

          // Step 2: Verify server's response proves server identity
          if (response.type === 'auth_success') {
            if (!this.pendingAuth) {
              log.error('Received auth_success without pending auth state');
              this.ws?.close(4002, 'Protocol error');
              return;
            }

            // Verify server's HMAC - proves server has access to stored secret
            if (
              !verifyHmac(
                this.pendingAuth.sharedSecret,
                buildServerHmacMessage(
                  this.pendingAuth.clientNonce,
                  this.pendingAuth.serverNonce,
                  response.agentId
                ),
                response.clientNonceHmac
              )
            ) {
              log.error(
                'Server HMAC verification failed - possible MITM attack'
              );
              this.pendingAuth = null;
              this.ws?.close(4002, 'Server verification failed');
              return;
            }

            // Clear pending auth state
            this.pendingAuth = null;
            this.isAuthenticated = true;

            log.info(`Mutual authentication successful`, {
              agentId: response.agentId,
              workingDirectory: this.config.handlerConfig.cwd,
              allowedTools: this.config.handlerConfig.allowedTools,
            });

            this.reconnectAttempts = 0;
            this.messageCount = 0;

            // Initialize message handler after authentication
            this.messageHandler = new MessageHandler(this.ws!, {
              handlerType: this.config.handlerType,
              config: this.config.handlerConfig,
              eventBuffer: this.eventBuffer,
            });

            // Flush any buffered events from previous connection
            if (this.eventBuffer.hasEvents) {
              log.info('Flushing buffered events after reconnection', {
                bufferedCount: this.eventBuffer.size,
              });
              const result = this.messageHandler.flushBuffer();
              if (result.failed) {
                log.warn(
                  'Buffer flush failed, will retry on next reconnection'
                );
              } else {
                log.info('Buffer flush completed', { flushed: result.flushed });
              }
            }

            log.debug('MessageHandler initialized');
            return;
          }

          if (response.type === 'auth_error') {
            log.error('Authentication failed', { error: response.error });
            this.pendingAuth = null;
            this.ws?.close(4001, 'Authentication failed');
            return;
          }
        } catch {
          // Not a JSON message, ignore during auth phase
        }
        return;
      }

      // Handle regular messages after authentication
      this.messageCount++;
      const messageSize = dataStr.length;

      log.debug(`Received message #${this.messageCount}`, {
        sizeBytes: messageSize,
        preview: messageSize > 200 ? dataStr.slice(0, 200) + '...' : dataStr,
      });

      if (this.messageHandler) {
        const startTime = Date.now();
        await this.messageHandler.handleMessage(dataStr);
        log.debug(`Message #${this.messageCount} processed`, {
          durationMs: Date.now() - startTime,
        });
      } else {
        log.warn('Received message but MessageHandler not initialized');
      }
    });

    this.ws.on('ping', () => {
      log.debug('Received ping from server, sending pong');
      this.ws?.pong();
    });

    this.ws.on('pong', () => {
      log.debug('Received pong from server');
    });

    this.ws.on('close', (code, reason) => {
      const sessionDuration = Date.now() - this.connectionStartTime;
      log.info('WebSocket connection closed', {
        code,
        reason: reason.toString() || 'none',
        sessionDurationMs: sessionDuration,
        messagesProcessed: this.messageCount,
      });

      this.messageHandler = null;
      this.isAuthenticated = false;
      this.pendingAuth = null;

      if (!this.isShuttingDown) {
        log.debug('Scheduling reconnect');
        this.scheduleReconnect();
      } else {
        log.info('Shutdown in progress, skipping reconnect');
      }
    });

    this.ws.on('error', (err) => {
      log.error('WebSocket error', {
        message: err.message,
        name: err.name,
        stack: err.stack,
      });
    });

    this.ws.on('unexpected-response', (_request, response) => {
      log.error('Unexpected HTTP response during WebSocket handshake', {
        statusCode: response.statusCode,
        statusMessage: response.statusMessage,
        headers: response.headers,
      });
    });
  }

  private scheduleReconnect(): void {
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    this.reconnectAttempts++;

    log.info(`Scheduling reconnect`, {
      delayMs: delay,
      attempt: this.reconnectAttempts,
      maxDelay: this.maxReconnectDelay,
    });

    setTimeout(() => {
      // Check shutdown flag to avoid reconnecting after shutdown() was called
      if (this.isShuttingDown) {
        log.debug('Reconnect timer fired but shutdown in progress, skipping');
        return;
      }
      log.debug('Reconnect timer fired, initiating connection');
      void this.connect();
    }, delay);
  }

  async shutdown(): Promise<void> {
    log.info('Shutdown requested');
    this.isShuttingDown = true;

    // Log warning if there are buffered events that will be lost
    if (this.eventBuffer.hasEvents) {
      log.warn('Discarding buffered events on shutdown', {
        count: this.eventBuffer.size,
      });
      this.eventBuffer.clear();
    }

    if (this.ws) {
      log.debug('Closing WebSocket connection');
      this.ws.close(1000, 'Client shutdown');
    }

    log.info('Shutdown complete');
  }
}
