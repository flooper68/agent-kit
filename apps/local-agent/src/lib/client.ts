import WebSocket from 'ws';
import { MessageHandler } from './message-handler';
import { EventBufferQueue } from './event-buffer-queue';
import { createLogger } from './logger';
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

  constructor(config: LocalAgentClientConfig) {
    this.config = config;
    // Event buffer persists across reconnections
    this.eventBuffer = new EventBufferQueue();
  }

  async connect(): Promise<void> {
    // Connect without API key in URL - send via first message after connection
    const wsUrl = `${this.config.serverUrl}/agents`;
    this.connectionStartTime = Date.now();
    this.isAuthenticated = false;

    log.info(`Initiating WebSocket connection`, {
      serverUrl: this.config.serverUrl,
      agentId: this.config.agentId ?? 'not-set',
      attempt: this.reconnectAttempts + 1,
    });

    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      const connectDuration = Date.now() - this.connectionStartTime;
      log.info(`WebSocket connection established, sending authentication`, {
        durationMs: connectDuration,
        agentId: this.config.agentId,
      });

      // Send authentication as first message (not in URL to avoid logging)
      this.ws!.send(
        JSON.stringify({
          type: 'auth',
          key: this.config.agentApiKey,
        })
      );
    });

    this.ws.on('message', async (data) => {
      const dataStr = data.toString();

      // Handle authentication response
      if (!this.isAuthenticated) {
        try {
          const response = JSON.parse(dataStr);
          if (response.type === 'auth_success') {
            this.isAuthenticated = true;
            log.info(`Authentication successful`, {
              agentId: this.config.agentId,
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
          } else if (response.type === 'auth_error') {
            log.error('Authentication failed', { error: response.error });
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
