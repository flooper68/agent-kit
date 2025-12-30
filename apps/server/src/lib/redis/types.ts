export interface RedisConfig {
  url: string;
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
  lazyConnect?: boolean;
}

export type AgentSessionChannel = `agent:session:${string}`;
export type AgentEventChannel = `agent:events:${string}`;

export interface AgentSessionMessage {
  type: 'session_created' | 'session_updated' | 'session_ended';
  sessionId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface AgentEventMessage {
  type: 'tool_started' | 'tool_completed' | 'message_received' | 'error';
  sessionId: string;
  timestamp: string;
  data: unknown;
}

export interface PubSubMessage<T = unknown> {
  channel: string;
  data: T;
  publishedAt: string;
}
