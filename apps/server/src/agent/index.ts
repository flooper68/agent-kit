// Agent system exports
// This file provides backward-compatible exports from the refactored structure

// Shared exports (types, spawning, events, etc.)
export * from './shared';

// Server agent exports (job handling, providers, etc.)
export {
  AgentJobHandler,
  convertToAIMessages,
  JobQueueManager,
  JOB_QUEUE_CONFIG,
  AgentJobSchema,
  JobRegistryManager,
  StreamingStateManager,
  STREAMING_HEARTBEAT_INTERVAL_MS,
  getProvider,
  registerProvider,
  listProviders,
  AgentWorker,
} from './server';
export type {
  DbMessage,
  AgentJob,
  JobHandler,
  StreamingState,
} from './server';

// Remote agent exports (WebSocket, connections)
export {
  ExternalAgentsConnectionManager,
  ExternalAgentWebSocketRegistry,
  ExternalAgentWebSocketService,
} from './remote';
export type {
  ExternalAgentConnection,
  ConnectionStatusUpdate,
} from './remote';

// Tools
export { getToolsById, listToolIds } from './tools';
export type { ToolContext } from './tools';
