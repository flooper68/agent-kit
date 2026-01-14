// Agent system exports
export * from './types';
export { getProvider, registerProvider, listProviders } from './providers';
export { getToolsById, listToolIds } from './tools';
export type { ToolContext, ToolsContext, ActionsContext } from './tools';
export { AgentWorker } from './server/worker';
export {
  AgentJobHandler,
  convertToAIMessages,
} from './server/agent-job-handler';
export type { DbMessage } from './server/agent-job-handler';

// Infrastructure managers (split from AgentSessionManager)
export { JobQueueManager } from './server/job-queue-manager';
export type { AgentJob, JobHandler } from './server/job-queue-manager';
export { EventStreamManager } from '../streams/event-stream-manager';
export type {
  StreamEvent,
  RedisConnectionFactory,
} from '../streams/event-stream-manager';
export { JobRegistryManager } from './server/job-registry-manager';
export { StreamingStateManager } from '../real-time/streaming-state-manager';
export type { StreamingState } from '../real-time/streaming-state-manager';
export { STREAMING_HEARTBEAT_INTERVAL_MS } from '../real-time/streaming-state-manager';

// Session summarization
export {
  SessionSummarizer,
  SUMMARIZATION_THRESHOLDS,
} from './prompts/session-summarizer';
export type {
  SessionSummary,
  SummarizerConfig,
} from './prompts/session-summarizer';

// External agent connection management
export { ExternalAgentsConnectionManager } from './external/external-agents-connection-manager';
export type {
  ExternalAgentConnection,
  ConnectionStatusUpdate,
} from './external/external-agents-connection-manager';
export { ExternalAgentWebSocketRegistry } from './external/external-agent-websocket-registry';
export { ExternalAgentWebSocketService } from './external/external-agent-websocket-service';

// Agent spawning
export { AgentSpawner } from './agent-spawner';
export type {
  SpawnInput,
  SpawnResult,
  SpawnAndWaitResult,
  // Legacy aliases
  SpawnAgentInput,
  SpawnAgentResult,
} from './agent-spawner';
