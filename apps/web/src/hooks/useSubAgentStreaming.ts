import { useState, useCallback, useEffect, useRef } from 'react';
import { trpc } from '../lib/trpc';
import type {
  TaskMessage,
  TextPart,
  ReasoningPart,
  ToolInvocationPart,
  ToolResultPart,
  TodoItem,
} from '@agent-kit/ui';
import type { StreamEvent } from './useAgentSession.types';

export type SubAgentStatus = 'idle' | 'active' | 'complete' | 'error';

export interface UseSubAgentStreamingOptions {
  sessionId: string | null;
  enabled: boolean;
}

export interface UseSubAgentStreamingReturn {
  messages: TaskMessage[];
  isStreaming: boolean;
  status: SubAgentStatus;
  latestAction?: string;
  todos: TodoItem[];
  streamingStartTime: number | null;
  /** Pre-calculated duration for completed sessions (stable across refreshes) */
  completedDuration: number | null;
}

// Maximum size for tracking refs to prevent memory leaks
const MAX_PENDING_SESSIONS = 100;
const MAX_PROCESSED_EVENTS = 1000;

// Helper to generate unique part IDs
function generatePartId(): string {
  return `part-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Type guard for ToolInvocationPart
function isToolInvocationPart(part: unknown): part is ToolInvocationPart {
  return (
    typeof part === 'object' &&
    part !== null &&
    'type' in part &&
    (part as { type: string }).type === 'tool_invocation' &&
    'toolCallId' in part
  );
}

// Helper to create a text part
function createTextPart(content: string): TextPart {
  return { type: 'text', id: generatePartId(), content };
}

// Helper to create a reasoning part
function createReasoningPart(
  content: string,
  isCollapsed?: boolean
): ReasoningPart {
  return { type: 'reasoning', id: generatePartId(), content, isCollapsed };
}

// Helper to create a tool invocation part
function createToolInvocationPart(
  toolCallId: string,
  toolName: string,
  args: Record<string, unknown> = {},
  state: 'pending' | 'running' | 'completed' | 'error' = 'running'
): ToolInvocationPart {
  return {
    type: 'tool_invocation',
    id: generatePartId(),
    toolCallId,
    toolName,
    args,
    state,
  };
}

// Helper to create a tool result part
function createToolResultPart(
  toolCallId: string,
  result: unknown,
  isError?: boolean
): ToolResultPart {
  return {
    type: 'tool_result',
    id: generatePartId(),
    toolCallId,
    result,
    isError,
  };
}

export function useSubAgentStreaming(
  options: UseSubAgentStreamingOptions
): UseSubAgentStreamingReturn {
  const { sessionId, enabled } = options;

  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState<SubAgentStatus>('idle');
  const [latestAction, setLatestAction] = useState<string | undefined>();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [streamingStartTime, setStreamingStartTime] = useState<number | null>(
    null
  );
  const [actualDuration, setActualDuration] = useState<number | null>(null);

  // Track start timestamp for duration calculation
  const messageStartTimestampRef = useRef<string | null>(null);

  // Track accumulated text for streaming
  const accumulatedTextRef = useRef<Record<string, string>>({});
  const accumulatedReasoningRef = useRef<Record<string, string>>({});
  // Track when a new text part is needed (after tool calls)
  const needsNewTextPartRef = useRef<Record<string, boolean>>({});
  const needsNewReasoningPartRef = useRef<Record<string, boolean>>({});
  // Track pending spawned sessions (when spawn_session_created arrives before tool_call_start)
  const pendingSpawnedSessionsRef = useRef<Record<string, string>>({});
  // Track processed spawn events for idempotency (prevents race condition)
  const processedSpawnEventsRef = useRef<Set<string>>(new Set());

  // Reset state when sessionId changes
  useEffect(() => {
    setMessages([]);
    setIsStreaming(false);
    setStatus(sessionId ? 'active' : 'idle');
    setLatestAction(undefined);
    setTodos([]);
    setStreamingStartTime(null);
    setActualDuration(null);
    messageStartTimestampRef.current = null;
    accumulatedTextRef.current = {};
    accumulatedReasoningRef.current = {};
    needsNewTextPartRef.current = {};
    needsNewReasoningPartRef.current = {};
    pendingSpawnedSessionsRef.current = {};
    processedSpawnEventsRef.current = new Set();

    // Cleanup on unmount to prevent memory leaks
    return () => {
      messageStartTimestampRef.current = null;
      accumulatedTextRef.current = {};
      accumulatedReasoningRef.current = {};
      needsNewTextPartRef.current = {};
      needsNewReasoningPartRef.current = {};
      pendingSpawnedSessionsRef.current = {};
      processedSpawnEventsRef.current.clear();
    };
  }, [sessionId]);

  // Handle stream events
  const handleEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case 'user_message_created':
        setMessages((prev) => {
          // Check if message already exists
          if (prev.some((m) => m.id === event.messageId)) {
            return prev;
          }

          return [
            ...prev,
            {
              id: event.messageId,
              role: 'user' as const,
              parts: [createTextPart(event.content)],
              createdAt: new Date(),
            },
          ];
        });
        break;

      case 'message_start':
        setIsStreaming(true);
        setStatus('active');
        // Track event timestamp for duration calculation
        messageStartTimestampRef.current = event.timestamp ?? null;
        // Use event timestamp for accurate timing (especially during replay)
        if (event.timestamp) {
          setStreamingStartTime(new Date(event.timestamp).getTime());
        } else {
          setStreamingStartTime(Date.now());
        }
        // Initialize accumulators for this message
        accumulatedTextRef.current[event.messageId] = '';
        accumulatedReasoningRef.current[event.messageId] = '';
        needsNewTextPartRef.current[event.messageId] = false;
        needsNewReasoningPartRef.current[event.messageId] = false;

        // Create placeholder assistant message
        setMessages((prev) => {
          if (prev.some((m) => m.id === event.messageId)) {
            return prev;
          }
          return [
            ...prev,
            {
              id: event.messageId,
              role: 'assistant' as const,
              parts: [],
              createdAt: new Date(),
            },
          ];
        });
        break;

      case 'text_delta': {
        const needsNewPart =
          needsNewTextPartRef.current[event.messageId] ?? false;

        if (needsNewPart) {
          needsNewTextPartRef.current[event.messageId] = false;
          accumulatedTextRef.current[event.messageId] = '';
        }

        accumulatedTextRef.current[event.messageId] =
          (accumulatedTextRef.current[event.messageId] || '') + event.delta;
        const newContent = accumulatedTextRef.current[event.messageId] || '';

        // Update latest action with current text
        setLatestAction(newContent.slice(0, 100));

        setMessages((prev) => {
          const existing = prev.find((m) => m.id === event.messageId);

          if (existing) {
            return prev.map((m) => {
              if (m.id !== event.messageId) return m;

              const newParts = [...m.parts];
              if (needsNewPart) {
                newParts.push(createTextPart(newContent));
              } else {
                // Find the LAST text part to update
                let textPartIndex = -1;
                for (let i = newParts.length - 1; i >= 0; i--) {
                  if (newParts[i]?.type === 'text') {
                    textPartIndex = i;
                    break;
                  }
                }

                if (textPartIndex >= 0) {
                  const existingPart = newParts[textPartIndex];
                  if (existingPart) {
                    newParts[textPartIndex] = {
                      ...existingPart,
                      content: newContent,
                    } as TextPart;
                  }
                } else {
                  newParts.push(createTextPart(newContent));
                }
              }

              return { ...m, parts: newParts };
            });
          } else {
            return [
              ...prev,
              {
                id: event.messageId,
                role: 'assistant' as const,
                parts: [createTextPart(newContent)],
                createdAt: new Date(),
              },
            ];
          }
        });
        break;
      }

      case 'reasoning_delta': {
        const needsNewPart =
          needsNewReasoningPartRef.current[event.messageId] ?? false;

        if (needsNewPart) {
          needsNewReasoningPartRef.current[event.messageId] = false;
          accumulatedReasoningRef.current[event.messageId] = '';
        }

        accumulatedReasoningRef.current[event.messageId] =
          (accumulatedReasoningRef.current[event.messageId] || '') +
          event.delta;
        const currentReasoning =
          accumulatedReasoningRef.current[event.messageId] || '';

        setMessages((prev) => {
          const existing = prev.find((m) => m.id === event.messageId);

          if (existing) {
            return prev.map((m) => {
              if (m.id !== event.messageId) return m;

              const newParts = [...m.parts];
              if (needsNewPart) {
                newParts.push(createReasoningPart(currentReasoning));
              } else {
                let reasoningPartIndex = -1;
                for (let i = newParts.length - 1; i >= 0; i--) {
                  if (newParts[i]?.type === 'reasoning') {
                    reasoningPartIndex = i;
                    break;
                  }
                }

                if (reasoningPartIndex >= 0) {
                  const existingPart = newParts[reasoningPartIndex];
                  if (existingPart) {
                    newParts[reasoningPartIndex] = {
                      ...existingPart,
                      content: currentReasoning,
                    } as ReasoningPart;
                  }
                } else {
                  newParts.push(createReasoningPart(currentReasoning));
                }
              }

              return { ...m, parts: newParts };
            });
          } else {
            return [
              ...prev,
              {
                id: event.messageId,
                role: 'assistant' as const,
                parts: [createReasoningPart(currentReasoning)],
                createdAt: new Date(),
              },
            ];
          }
        });
        break;
      }

      case 'tool_call_start': {
        needsNewTextPartRef.current[event.messageId] = true;
        needsNewReasoningPartRef.current[event.messageId] = true;
        setLatestAction(`Using ${event.toolName}...`);
        // Extract todos from TodoWrite tool
        if (
          event.toolName === 'TodoWrite' &&
          event.toolArgs &&
          Array.isArray(event.toolArgs.todos)
        ) {
          setTodos(event.toolArgs.todos as TodoItem[]);
        }

        // Check if spawn_session_created arrived before this tool_call_start
        const pendingSpawnedSessionId =
          pendingSpawnedSessionsRef.current[event.toolCallId];
        if (pendingSpawnedSessionId) {
          delete pendingSpawnedSessionsRef.current[event.toolCallId];
        }

        // Include pending spawnedSessionId in args if it exists
        const toolArgs = pendingSpawnedSessionId
          ? { ...event.toolArgs, spawnedSessionId: pendingSpawnedSessionId }
          : (event.toolArgs ?? {});

        setMessages((prev) => {
          const existing = prev.find((m) => m.id === event.messageId);
          const newPart = createToolInvocationPart(
            event.toolCallId,
            event.toolName,
            toolArgs,
            'running'
          );

          if (existing) {
            return prev.map((m) => {
              if (m.id !== event.messageId) return m;
              return { ...m, parts: [...m.parts, newPart] };
            });
          } else {
            return [
              ...prev,
              {
                id: event.messageId,
                role: 'assistant' as const,
                parts: [newPart],
                createdAt: new Date(),
              },
            ];
          }
        });
        break;
      }

      case 'tool_result':
        setMessages((prev) => {
          const existing = prev.find((m) => m.id === event.messageId);
          const resultPart = createToolResultPart(
            event.toolCallId,
            event.result,
            event.isError
          );

          if (existing) {
            return prev.map((m) => {
              if (m.id !== event.messageId) return m;
              const newParts = m.parts.map((p) => {
                if (
                  p.type === 'tool_invocation' &&
                  p.toolCallId === event.toolCallId
                ) {
                  return {
                    ...p,
                    state: event.isError
                      ? ('error' as const)
                      : ('completed' as const),
                  };
                }
                return p;
              });
              newParts.push(resultPart);
              return { ...m, parts: newParts };
            });
          } else {
            return [
              ...prev,
              {
                id: event.messageId,
                role: 'assistant' as const,
                parts: [resultPart],
                createdAt: new Date(),
              },
            ];
          }
        });
        break;

      case 'message_complete':
        // Calculate actual duration from event timestamps
        if (messageStartTimestampRef.current && event.timestamp) {
          const startMs = new Date(messageStartTimestampRef.current).getTime();
          const endMs = new Date(event.timestamp).getTime();
          const duration = Math.max(1, Math.floor((endMs - startMs) / 1000));
          setActualDuration(duration);
        }
        messageStartTimestampRef.current = null;
        setIsStreaming(false);
        setStatus('complete');
        setLatestAction(undefined);
        setStreamingStartTime(null);
        // Clean up accumulators
        delete accumulatedTextRef.current[event.messageId];
        delete accumulatedReasoningRef.current[event.messageId];
        delete needsNewTextPartRef.current[event.messageId];
        delete needsNewReasoningPartRef.current[event.messageId];
        break;

      case 'error':
        // Calculate duration on error too
        if (messageStartTimestampRef.current && event.timestamp) {
          const startMs = new Date(messageStartTimestampRef.current).getTime();
          const endMs = new Date(event.timestamp).getTime();
          const duration = Math.max(1, Math.floor((endMs - startMs) / 1000));
          setActualDuration(duration);
        }
        messageStartTimestampRef.current = null;
        setIsStreaming(false);
        setStatus('error');
        setLatestAction(undefined);
        setStreamingStartTime(null);
        break;

      case 'interrupted':
        // Calculate duration on interrupt too
        if (messageStartTimestampRef.current && event.timestamp) {
          const startMs = new Date(messageStartTimestampRef.current).getTime();
          const endMs = new Date(event.timestamp).getTime();
          const duration = Math.max(1, Math.floor((endMs - startMs) / 1000));
          setActualDuration(duration);
        }
        messageStartTimestampRef.current = null;
        setIsStreaming(false);
        setStatus('complete');
        setLatestAction(undefined);
        setStreamingStartTime(null);
        break;

      case 'spawn_session_created': {
        // Idempotency check - skip if already processed (prevents race condition)
        const spawnKey = `${event.messageId}:${event.toolCallId}`;
        if (processedSpawnEventsRef.current.has(spawnKey)) {
          break;
        }
        // Prevent memory leak by clearing if set exceeds limit
        if (processedSpawnEventsRef.current.size >= MAX_PROCESSED_EVENTS) {
          processedSpawnEventsRef.current.clear();
        }
        processedSpawnEventsRef.current.add(spawnKey);

        // Update the spawnAgent tool invocation part with the spawned sessionId
        // This enables the "Open Full View" button to work while the sub-agent is still running
        setMessages((prev) => {
          // Check if the tool invocation part exists using type guard
          const msg = prev.find((m) => m.id === event.messageId);
          const toolInvocationExists = msg?.parts.some(
            (p) => isToolInvocationPart(p) && p.toolCallId === event.toolCallId
          );

          if (!toolInvocationExists) {
            // tool_call_start hasn't arrived yet, store for later
            // Prevent memory leak by clearing if object exceeds limit
            if (
              Object.keys(pendingSpawnedSessionsRef.current).length >=
              MAX_PENDING_SESSIONS
            ) {
              pendingSpawnedSessionsRef.current = {};
            }
            pendingSpawnedSessionsRef.current[event.toolCallId] =
              event.spawnedSessionId;
            return prev;
          }

          // Tool invocation exists, update it
          return prev.map((m) => {
            if (m.id !== event.messageId) return m;
            return {
              ...m,
              parts: m.parts.map((part) => {
                if (!isToolInvocationPart(part)) return part;
                if (part.toolCallId !== event.toolCallId) return part;
                // Skip if already has spawnedSessionId
                if (part.args.spawnedSessionId) return part;
                return {
                  ...part,
                  args: {
                    ...part.args,
                    spawnedSessionId: event.spawnedSessionId,
                  },
                };
              }),
            };
          });
        });
        break;
      }
    }
  }, []);

  // Subscribe to message stream
  // Cast handleEvent to accept the server's event type which may include additional event types
  trpc.messages.subscribe.useSubscription(
    {
      sessionId: sessionId!,
      replayHistory: true,
    },
    {
      enabled: enabled && !!sessionId,
      onData: handleEvent as (event: unknown) => void,
      onError: (error) => {
        console.error('[SubAgentStreaming] Subscription error:', error);
        setStatus('error');
        setIsStreaming(false);
      },
    }
  );

  return {
    messages,
    isStreaming,
    status,
    latestAction,
    todos,
    streamingStartTime,
    completedDuration: actualDuration,
  };
}
