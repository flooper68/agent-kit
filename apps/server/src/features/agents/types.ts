import type { AgentSession } from '../../db/schema/agent-sessions';
import type {
  AgentSessionMessage,
  MessagePart,
  AgentSessionMessageStatus,
  AgentSessionMessageMetadata,
} from '../../db/schema/agent-session-messages';
import type { NewAgentSessionEvent } from '../../db/schema/agent-session-events';

// Re-export for convenience
export type {
  AgentSession,
  AgentSessionMessage,
  MessagePart,
  AgentSessionMessageStatus,
  AgentSessionMessageMetadata,
  NewAgentSessionEvent,
};

// Agent definition (from registry, prepared for DB)
export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  provider: string;
  model: string;
  tools: string[];
  releasedAt: Date;
  /** Timeout in milliseconds for spawned agent responses (default: 900000 / 15 minutes) */
  spawnTimeout?: number;
}

// Command input types
export interface CreateSessionInput {
  userId: string;
  orgId: string;
  agentId: string;
  title?: string;
  isLocalAgent?: boolean;
  /** Parent session ID for spawned sessions */
  parentSessionId?: string;
  /** Spawn depth for tracking recursion (0 for root sessions) */
  spawnDepth?: number;
}

export interface UpdateSessionTitleInput {
  sessionId: string;
  title: string;
}

export interface UpdateSessionSummaryInput {
  sessionId: string;
  title: string;
  description: string;
}

export interface CreateMessageInput {
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  status: AgentSessionMessageStatus;
}

export interface UpdateMessageStatusInput {
  messageId: string;
  status: AgentSessionMessageStatus;
  metadata?: AgentSessionMessageMetadata;
}

// Query result types
export interface SessionWithMessages extends AgentSession {
  messages: Array<AgentSessionMessage & { parts: MessagePart[] }>;
  /** Resolved agent name (for display). For local agents, this is the full name, not the key. */
  agentName?: string;
}

export interface MessageWithParts {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: MessagePart[];
}

export interface PaginatedSessions {
  items: AgentSession[];
  nextCursor: string | undefined;
  totalCount: number;
}
