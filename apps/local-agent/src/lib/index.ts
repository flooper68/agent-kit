// Core classes
export { LocalAgentClient, type LocalAgentClientConfig } from './client';
export { MessageHandler, type MessageHandlerOptions } from './message-handler';
export { EventBufferQueue, type BufferedEvent } from './event-buffer-queue';
export { Logger, createLogger, logger } from './logger';

// Handler infrastructure
export {
  createHandler,
  registerHandler,
  listHandlerTypes,
  type HandlerFactory,
} from './handlers';

// Types and schemas
export * from './types';
