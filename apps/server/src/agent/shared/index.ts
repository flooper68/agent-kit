// Shared agent exports (used by both server and remote agents)

// Types
export * from './types';

// Errors
export {
  classifyError,
  createToolError,
} from './errors';
export type {
  AgentErrorCode,
  AgentErrorDetails,
  AgentError,
} from './errors';

// Agent spawning
export { AgentSpawner } from './spawner';
export type {
  SpawnInput,
  SpawnResult,
  SpawnAndWaitResult,
  SpawnAgentInput,
  SpawnAgentResult,
} from './spawner';

// Spawn configuration
export { SPAWN_CONFIG } from './spawn-config';

// System prompt building
export { buildSystemPrompt, getAvailableAgents } from './system-prompt-builder';
export type { SpawnableAgent, SkillInfo } from './system-prompt-builder';

// Event streaming
export { EventStreamManager, StreamEventSchema } from './event-stream-manager';
export type { StreamEvent, RedisConnectionFactory } from './event-stream-manager';

// Event buffering
export { EventBuffer } from './event-buffer';
export type { BufferableEvent, BufferedResult } from './event-buffer';

// Session summarization
export { SessionSummarizer, SUMMARIZATION_THRESHOLDS } from './session-summarizer';
export type { SessionSummary, SummarizerConfig } from './session-summarizer';

// Logger
export { logger } from './logger';
export type { LogLevel, LogContext } from './logger';

// Validation
export * from './validation';
