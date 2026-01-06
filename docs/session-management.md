# Session Management

This document describes how session management works in the Agent Kit application, covering session lifecycle, state management, streaming, and data persistence.

## Overview

The Agent Kit uses a sophisticated session management system that handles conversations between users and AI agents. Sessions contain messages, track usage, maintain streaming state, and support real-time event processing.

## Core Components

### 1. Session Data Model

Sessions are stored in the database with the following key fields:

- `id`: Unique UUID identifier
- `userId`: Owner of the session
- `orgId`: Organization (for multi-tenancy)
- `agentId`: AI agent being used
- `title`: Session title (auto-generated or user-provided)
- `summary`: Auto-generated summary for long sessions
- `isLocalAgent`: Whether using a local or server agent
- `usage`: Token usage and cost tracking
- `messageCount`: Number of messages in session
- `createdAt` / `updatedAt`: Timestamps

### 2. AgentsFeature - Central Session Management

The `AgentsFeature` class (`apps/server/src/features/agents/agents-feature.ts`) acts as the main orchestrator for session operations:

#### Session Operations

- **Create**: `sessions.create()` - Creates new sessions with agent validation
- **Read**: `sessions.getById()`, `sessions.getWithMessages()` - Retrieval operations
- **Update**: `sessions.updateTitle()`, `sessions.updateUsage()` - Modification operations
- **Delete**: `sessions.delete()` - Session cleanup
- **List**: `sessions.listByUser()` - User's session history with streaming status

#### Message Operations

- **Create**: `messages.create()` - Add user/assistant messages
- **Update**: `messages.updateStatus()` - Track completion state

#### Event Operations

- **Insert**: `events.insert()` - Stream events for real-time updates

### 3. Streaming State Management

#### StreamingStateManager

The `StreamingStateManager` (`apps/server/src/agent/streaming-state-manager.ts`) manages active streaming sessions using Redis:

- **Redis Storage**: Session state with TTL (5 minutes) for auto-cleanup
- **Heartbeat System**: Extends TTL during long-running operations
- **Pub/Sub Events**: Notifies clients when streaming starts/stops
- **Recovery Support**: Query active sessions for client reconnection

```typescript
interface StreamingState {
  sessionId: string;
  userId: string;
  agentId: string;
  isLocalAgent: boolean;
  startedAt: string;
  lastHeartbeat: string;
}
```

#### Key Methods

- `startStreaming()`: Mark session as actively processing
- `stopStreaming()`: Mark session as complete
- `sendHeartbeat()`: Extend TTL during long operations
- `isStreaming()`: Check if session is active
- `getActiveSessionIds()`: Get all streaming sessions

### 4. Session API (tRPC)

The session router (`apps/server/src/trpc/routers/sessions.ts`) exposes session operations:

#### Endpoints

- `create`: Create new session with agent validation
- `list`: Get user's sessions with streaming status
- `get`: Get session with messages and streaming info
- `getResources`: Get session-related artifacts
- `updateTitle`: Change session title
- `delete`: Remove session
- `isStreaming`: Check streaming status for recovery

#### Security

- **sessionProcedure**: Middleware that verifies session ownership
- **orgProcedure**: Organization-scoped operations
- User can only access their own sessions

## Real-time Features

### 1. Event Streaming

Sessions use WebSocket-based event streaming for real-time updates:

#### Event Types

- `user_message_created`: User sent a message
- `message_start`: AI response begins
- `text_delta`: Streaming text content
- `reasoning_delta`: AI reasoning content
- `tool_call_start`: AI tool invocation
- `tool_result`: Tool execution result
- `message_complete`: AI response finished
- `error`: Processing error
- `interrupted`: User interrupted response

#### Event Flow

1. User sends message → `user_message_created`
2. AI starts responding → `message_start`
3. Content streams → `text_delta` / `reasoning_delta`
4. Tools execute → `tool_call_start` / `tool_result`
5. Response completes → `message_complete`

### 2. Client Session Hook

The `useAgentSession` hook (`apps/web/src/hooks/useAgentSession.ts`) manages client-side session state:

#### Features

- **Optimistic Updates**: Immediate UI feedback
- **Event Processing**: Real-time message building
- **State Recovery**: Reconnection handling
- **Error Management**: Network and API error handling
- **Subscription Management**: WebSocket lifecycle

#### State Management

- `messages`: Array of conversation messages
- `status`: 'ready' | 'submitted' | 'streaming' | 'loading' | 'error'
- `thinkingStatus`: AI reasoning state
- `todos`: Task tracking from TodoWrite tool
- `contextUsage`: Token usage and cost

## Session Lifecycle

### 1. Session Creation

```typescript
// 1. Client creates session
const session = await trpc.sessions.create.mutate({
  agentId: 'assistant-opus-4.5',
  title: 'Optional title',
  isLocalAgent: false,
});

// 2. Server validates agent and creates DB record
// 3. Returns session ID for subsequent operations
```

### 2. Message Exchange

```typescript
// 1. User sends message
await trpc.messages.send.mutate({
  sessionId: 'session-uuid',
  content: 'Hello, AI!',
});

// 2. System creates user message and assistant placeholder
// 3. Streaming starts with real-time events
// 4. Message completes with usage tracking
```

### 3. State Synchronization

The system maintains consistency between database state and real-time streaming:

1. **Database**: Persistent message storage
2. **Redis**: Streaming state and pub/sub
3. **WebSocket**: Real-time events
4. **Client**: Optimistic updates and recovery

### 4. Session Recovery

When clients reconnect:

1. Query session with `lastStreamId`
2. Subscribe to events from that point
3. Replay missed events if needed
4. Restore streaming state if active

## Data Persistence

### 1. Database Schema

Sessions use PostgreSQL with the following relationships:

```
sessions (1) → (n) messages
messages (1) → (n) message_parts
sessions (1) → (n) session_events
sessions (n) → (1) agents
```

### 2. Message Parts

Messages contain structured parts:

- **Text**: Regular conversation content
- **Reasoning**: AI internal thoughts
- **Tool Invocation**: Function calls with parameters
- **Tool Result**: Function execution results

### 3. Usage Tracking

Each session tracks:

- Prompt tokens (input)
- Completion tokens (output)
- Total tokens (sum)
- Estimated cost (based on model pricing)

## Error Handling

### 1. Streaming Errors

- **Network**: WebSocket disconnection
- **Rate Limit**: API quota exceeded
- **Tool Error**: Function execution failure
- **Interruption**: User cancellation

### 2. Recovery Mechanisms

- **Auto-reconnect**: WebSocket retries
- **State Sync**: Query after reconnection
- **Graceful Degradation**: Show errors with retry options
- **Timeout Protection**: TTL-based cleanup

## Performance Optimizations

### 1. Streaming State

- **Redis TTL**: Auto-cleanup crashed sessions (5 min)
- **Heartbeat**: Efficient long-operation tracking
- **Batch Queries**: Get all streaming sessions at once

### 2. Client Optimizations

- **Event Deduplication**: Prevent duplicate processing
- **Optimistic Updates**: Immediate UI feedback
- **Lazy Loading**: Load sessions on demand
- **Memory Management**: Bounded event history

## Security Considerations

### 1. Session Access Control

- Sessions are scoped to user/organization
- Middleware validates ownership on every operation
- No cross-user session access

### 2. Streaming Security

- WebSocket connections authenticated
- Event streams filtered by user permissions
- Redis state includes user context

## Monitoring and Debugging

### 1. Logging

The system provides comprehensive logging:

```typescript
console.log('[StreamingState] Started streaming for session', sessionId);
console.log('[AgentSession] Event:', event.type, event);
```

### 2. State Inspection

Development tools available:

- Session streaming status queries
- Active session enumeration
- Event stream debugging
- Redis state inspection

## Integration Points

### 1. Local Agents

Sessions work with both server and local agents:

- `isLocalAgent` flag tracks type
- Different connection mechanisms
- Unified streaming interface

### 2. Client Tools

Sessions support client-side tool execution:

- `client_tool_request` events
- Browser navigation control
- UI state queries

### 3. Cache Invalidation

Real-time pub/sub for cache updates:

- Session list invalidation
- Streaming state changes
- Resource creation events

---

This session management system provides a robust foundation for real-time AI conversations with strong consistency, recovery mechanisms, and performance optimizations.
