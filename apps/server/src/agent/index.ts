// Agent system exports
export * from './types';
export { getProvider, registerProvider, listProviders } from './providers';
export { getToolsById, listToolIds } from './tools';
export type { ToolContext } from './tools';
export { AgentWorker } from './worker';
export { AgentJobHandler, convertToAIMessages } from './agent-job-handler';
export type { DbMessage } from './agent-job-handler';

// Infrastructure managers (split from AgentSessionManager)
export { JobQueueManager } from './job-queue-manager';
export type { AgentJob, JobHandler } from './job-queue-manager';
export { EventStreamManager } from './event-stream-manager';
export type {
  StreamEvent,
  RedisConnectionFactory,
} from './event-stream-manager';
export { JobRegistryManager } from './job-registry-manager';
export { StreamingStateManager } from './streaming-state-manager';
export type { StreamingState } from './streaming-state-manager';
export { STREAMING_HEARTBEAT_INTERVAL_MS } from './streaming-state-manager';

// Session summarization
export {
  SessionSummarizer,
  SUMMARIZATION_THRESHOLDS,
} from './session-summarizer';
export type { SessionSummary, SummarizerConfig } from './session-summarizer';

// Local agent connection management
export { LocalAgentsConnectionManager } from './local-agents-connection-manager';
export type {
  LocalAgentConnection,
  ConnectionStatusUpdate,
} from './local-agents-connection-manager';
export { LocalAgentWebSocketRegistry } from './local-agent-websocket-registry';
export { LocalAgentWebSocketService } from './local-agent-websocket-service';

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
