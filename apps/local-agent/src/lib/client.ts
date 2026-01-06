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

  constructor(config: LocalAgentClientConfig) {
    this.config = config;
    // Event buffer persists across reconnections
    this.eventBuffer = new EventBufferQueue();
  }

  async connect(): Promise<void> {
    const wsUrl = `${this.config.serverUrl}/agents?key=${this.config.agentApiKey}`;
    this.connectionStartTime = Date.now();

    log.info(`Initiating WebSocket connection`, {
      serverUrl: this.config.serverUrl,
      agentId: this.config.agentId ?? 'not-set',
      attempt: this.reconnectAttempts + 1,
    });

    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      const connectDuration = Date.now() - this.connectionStartTime;
      log.info(`WebSocket connection established`, {
        durationMs: connectDuration,
        agentId: this.config.agentId,
        workingDirectory: this.config.handlerConfig.cwd,
        allowedTools: this.config.handlerConfig.allowedTools,
      });

      this.reconnectAttempts = 0;
      this.messageCount = 0;

      // Initialize message handler with handler type, config, and shared buffer
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
          log.warn('Buffer flush failed, will retry on next reconnection');
        } else {
          log.info('Buffer flush completed', { flushed: result.flushed });
        }
      }

      log.debug('MessageHandler initialized');
    });

    this.ws.on('ping', () => {
      log.debug('Received ping from server, sending pong');
      this.ws?.pong();
    });

    this.ws.on('pong', () => {
      log.debug('Received pong from server');
    });

    this.ws.on('message', async (data) => {
      this.messageCount++;
      const messageSize = data.toString().length;

      log.debug(`Received message #${this.messageCount}`, {
        sizeBytes: messageSize,
        preview:
          messageSize > 200
            ? data.toString().slice(0, 200) + '...'
            : data.toString(),
      });

      if (this.messageHandler) {
        const startTime = Date.now();
        await this.messageHandler.handleMessage(data.toString());
        log.debug(`Message #${this.messageCount} processed`, {
          durationMs: Date.now() - startTime,
        });
      } else {
        log.warn('Received message but MessageHandler not initialized');
      }
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
