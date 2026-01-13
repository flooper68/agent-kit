import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { trpc } from '../lib/trpc';
import { calculateCompletedDuration } from '../lib/time-utils';
import { useSession } from '../contexts/SessionContext';
import { getDefaultDependencies } from './useAgentSessionDependencies';
import type {
  AgentSessionDependencies,
  StreamEvent,
} from './useAgentSession.types';
import type {
  TaskMessage,
  TaskStatus,
  TaskError,
  ThinkingStatus,
  TextPart,
  ReasoningPart,
  ToolInvocationPart,
  ToolResultPart,
  ContextUsage,
  TodoItem,
} from '@agent-kit/ui';

/**
 * Request from the AI agent to execute a client-side tool.
 *
 * Client tools enable the agent to interact with the user's browser,
 * such as navigating to pages or querying the current UI state.
 *
 * @see /docs/architecture/client-tool-relaying.md for full documentation
 */
export interface ClientToolRequest {
  /** Tool identifier (e.g., 'navigateTo', 'getCurrentUIState') */
  toolName: string;
  /** UUID for correlating responses (used by stateful tools) */
  requestId: string;
  /** Tool-specific parameters */
  params: Record<string, unknown>;
  /** Whether the client must send a response back via tRPC */
  requiresResponse: boolean;
}

interface UseAgentSessionOptions {
  sessionId: string | null;
  onSessionInvalid?: () => void;
  onResourceCreated?: () => void;
  /** Called when the agent requests a client-side tool execution */
  onClientToolRequest?: (request: ClientToolRequest) => void;
}

interface UseAgentSessionReturn {
  setMessageListRef: (node: HTMLDivElement | null) => void;
  messages: TaskMessage[];
  status: TaskStatus;
  thinkingStatus: ThinkingStatus;
  sendMessage: (content: string, overrideSessionId?: string) => Promise<void>;
  interrupt: () => Promise<void>;
  isLoading: boolean;
  error: TaskError | null;
  retry: () => Promise<void>;
  dismissError: () => void;
  contextUsage: ContextUsage | null;
  handleScrollPositionChange: (isAtBottom: boolean) => void;
  showScrollButton: boolean;
  sessionAgentId: string | null;
  todos: TodoItem[];
  streamingStartTime: number | null;
  /** Pre-calculated duration for completed sessions (stable across refreshes) */
  completedDuration: number | null;
  /** Pending tool approval if awaiting user action */
  pendingApproval: { messageId: string; approvalId: string; toolCallId: string; toolName: string; args?: Record<string, unknown> } | null;
  /** Handle user approval/denial of pending tool */
  handleApproval: (approved: boolean) => Promise<void>;
  /** Whether approval mutation is in progress */
  isApprovalLoading: boolean;
}

// Map server error codes to TaskError types
function mapErrorCodeToType(
  code?: string
): 'api' | 'network' | 'rate_limit' | 'stream_interrupted' | 'tool_error' {
  switch (code) {
    case 'RATE_LIMIT':
      return 'rate_limit';
    case 'NETWORK_ERROR':
      return 'network';
    case 'TOOL_ERROR':
    case 'TOOL_SCHEMA_ERROR':
      return 'tool_error';
    case 'ABORT':
      return 'stream_interrupted';
    default:
      return 'api';
  }
}

// Helper to generate unique part IDs
function generatePartId(): string {
  return `part-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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

export function useAgentSession(
  {
    sessionId,
    onSessionInvalid,
    onResourceCreated,
    onClientToolRequest,
  }: UseAgentSessionOptions,
  injectedDeps?: AgentSessionDependencies
): UseAgentSessionReturn {
  // Use injected dependencies or defaults
  const deps = injectedDeps ?? getDefaultDependencies();
  const { setSessionStreaming } = useSession();
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const hasInitialScrolledRef = useRef<boolean>(false);
  // Track whether scroll button should be shown (user has scrolled away from bottom)
  const [showScrollButton, setShowScrollButton] = useState(false);
  const showScrollButtonRef = useRef(false);

  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [status, setStatus] = useState<TaskStatus>('ready');
  const [thinkingStatus, setThinkingStatus] = useState<ThinkingStatus>({
    isThinking: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<TaskError | null>(null);
  // Current context tokens from latest streaming event (snapshot, not accumulated)
  // This is separate from sessionQuery.data.usage which has accumulated server-side values
  const [currentContextTokens, setCurrentContextTokens] = useState<number>(0);
  // Track todos from TodoWrite tool events
  const [todos, setTodos] = useState<TodoItem[]>([]);

  // Track accumulated text for streaming
  const accumulatedTextRef = useRef<Record<string, string>>({});
  const accumulatedReasoningRef = useRef<Record<string, string>>({});
  // Track last user message for retry functionality
  const lastMessageRef = useRef<string | null>(null);
  // Track when a new text part is needed (after tool calls)
  const needsNewTextPartRef = useRef<Record<string, boolean>>({});
  // Track when a new reasoning part is needed (after tool calls)
  const needsNewReasoningPartRef = useRef<Record<string, boolean>>({});
  // Track the current reasoning part ID being built (to handle React state update timing)
  const currentReasoningPartIdRef = useRef<Record<string, string | null>>({});
  // Track if we've initiated creating a new reasoning part (to prevent duplicates from state batching)
  const creatingNewReasoningPartRef = useRef<Record<string, boolean>>({});
  // Track the current placeholder ID to avoid race conditions when replacing
  const currentPlaceholderIdRef = useRef<string | null>(null);
  // Track tool names by callId to identify resource-creating tools
  const toolNamesByCallIdRef = useRef<Record<string, string>>({});
  // Track pending spawned sessions (when spawn_session_created arrives before tool_call_start)
  const pendingSpawnedSessionsRef = useRef<Record<string, string>>({});
  // Track lastStreamId from session query for subscription resumption
  const lastStreamIdRef = useRef<string | undefined>(undefined);
  // Track message IDs loaded from DB to skip historical terminal events during replay
  const loadedMessageIdsRef = useRef<Set<string>>(new Set());

  // Sync streaming status to SessionContext for chat history/command palette
  // This eliminates race conditions with pub/sub event propagation
  useEffect(() => {
    if (!sessionId) return;

    if (status === 'streaming' || status === 'submitted') {
      setSessionStreaming(sessionId, true);
    } else {
      setSessionStreaming(sessionId, false);
    }
  }, [sessionId, status, setSessionStreaming]);

  // Get session data
  const sessionQuery = deps.useSessionQuery(sessionId);

  // Send message mutation
  const sendMutation = deps.useSendMutation();

  // Interrupt mutation
  const interruptMutation = deps.useInterruptMutation();

  // Approval mutation (direct tRPC, not injected)
  const approvalMutation = trpc.messages.resumeWithApproval.useMutation();

  // Reset state when sessionId changes
  useEffect(() => {
    // Clear messages and reset state when switching sessions
    setMessages([]);
    // Show loading state when switching to an existing chat, ready state for new chat
    setStatus(sessionId ? 'loading' : 'ready');
    setThinkingStatus({ isThinking: false });
    setError(null);
    setCurrentContextTokens(0);
    setTodos([]); // Reset todos when switching sessions
    setShowScrollButton(false); // Reset scroll button state
    showScrollButtonRef.current = false;
    accumulatedTextRef.current = {};
    accumulatedReasoningRef.current = {};
    needsNewTextPartRef.current = {};
    needsNewReasoningPartRef.current = {};
    currentReasoningPartIdRef.current = {};
    lastMessageRef.current = null;
    hasInitialScrolledRef.current = false;
    currentPlaceholderIdRef.current = null;
    toolNamesByCallIdRef.current = {};
    lastStreamIdRef.current = undefined;
    loadedMessageIdsRef.current = new Set();
    setStreamingStartTime(null);
  }, [sessionId]);

  // Handle invalid session (e.g., persisted session that no longer exists)
  useEffect(() => {
    if (sessionQuery.isError && onSessionInvalid) {
      onSessionInvalid();
    }
  }, [sessionQuery.isError, onSessionInvalid]);

  // Log session data when loaded
  useEffect(() => {
    if (sessionQuery.data) {
      console.log('[AgentSession] Session loaded:', sessionQuery.data);
    }
  }, [sessionQuery.data]);

  const setMessageListRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    messageListRef.current = node;
  }, []);

  useEffect(() => {
    hasInitialScrolledRef.current = false;
  }, [sessionId]);

  const debouncedScrollToBottom = useMemo(() => {
    const callback = () => {
      if (showScrollButtonRef.current) return;

      console.log('[AgentSession] Scrolling to bottom');

      const lastMessage = messageListRef.current?.children[
        messageListRef.current.children.length - 1
      ] as HTMLDivElement | undefined;

      lastMessage?.scrollIntoView({ behavior: 'smooth' });
    };

    let timeout: NodeJS.Timeout | null = null;

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(callback, 100);
    };
  }, []);

  // Subscribe to session events
  // Wait for isInitialized to be true so messages are loaded from DB first
  // When restoring a streaming session:
  // - replayHistory: true to get full event history from the beginning
  const subscription = deps.useMessageSubscription(
    {
      sessionId: sessionId!,
      lastEventId: undefined,
      replayHistory: true,
    },
    {
      enabled: !!sessionId,
      onData: (event: StreamEvent) => {
        console.log('[AgentSession] Event:', event.type, event);

        if (!hasInitialScrolledRef.current) {
          setTimeout(() => {
            console.log('[AgentSession] Scrolling to bottom');

            const lastMessage = messageListRef.current?.children[
              messageListRef.current.children.length - 1
            ] as HTMLDivElement | undefined;

            lastMessage?.scrollIntoView({ behavior: 'instant' });
          }, 100);
          hasInitialScrolledRef.current = true;
        } else if (!showScrollButtonRef.current) {
          // Only autoscroll if user hasn't scrolled away from bottom
          debouncedScrollToBottom();
        }

        switch (event.type) {
          case 'user_message_created':
            // Replace optimistic message with real one from server
            setMessages((prev) => {
              // Check if message already exists (avoid duplicates)
              if (prev.some((m) => m.id === event.messageId)) {
                return prev;
              }

              // Find and remove the optimistic message with matching content
              const optimisticIndex = prev.findIndex(
                (m) =>
                  m.id.startsWith('optimistic-') &&
                  m.role === 'user' &&
                  m.parts[0]?.type === 'text' &&
                  (m.parts[0] as TextPart).content === event.content
              );

              const realMessage: TaskMessage = {
                id: event.messageId,
                role: 'user' as const,
                parts: [createTextPart(event.content)],
                createdAt: new Date(),
              };

              if (optimisticIndex >= 0) {
                // Replace optimistic with real message at the same position
                const newMessages = [...prev];
                newMessages[optimisticIndex] = realMessage;
                return newMessages;
              }

              // No optimistic message found, just add the real one
              return [...prev, realMessage];
            });
            break;

          case 'message_start':
            setStatus('streaming');
            setThinkingStatus({ isThinking: true });
            // Use event timestamp for accurate timing (especially during replay)
            if (event.timestamp) {
              setStreamingStartTime(new Date(event.timestamp).getTime());
            }
            // Initialize accumulators for this message
            accumulatedTextRef.current[event.messageId] = '';
            accumulatedReasoningRef.current[event.messageId] = '';
            needsNewTextPartRef.current[event.messageId] = false;
            needsNewReasoningPartRef.current[event.messageId] = false;
            // Replace placeholder with real message ID using tracked placeholder ID
            setMessages((prev) => {
              const placeholderId = currentPlaceholderIdRef.current;
              if (!placeholderId) return prev;

              const placeholderIndex = prev.findIndex(
                (m) => m.id === placeholderId
              );
              if (placeholderIndex !== -1) {
                const updated = [...prev];
                const placeholder = updated[placeholderIndex];
                if (placeholder) {
                  updated[placeholderIndex] = {
                    ...placeholder,
                    id: event.messageId,
                  };
                }
                currentPlaceholderIdRef.current = null;
                return updated;
              }
              return prev;
            });
            break;

          case 'text_delta': {
            const needsNewPart =
              needsNewTextPartRef.current[event.messageId] ?? false;

            if (needsNewPart) {
              // Reset flag and clear accumulator for new segment
              needsNewTextPartRef.current[event.messageId] = false;
              accumulatedTextRef.current[event.messageId] = '';
            }

            // Append the delta
            accumulatedTextRef.current[event.messageId] =
              (accumulatedTextRef.current[event.messageId] || '') + event.delta;
            const newContent =
              accumulatedTextRef.current[event.messageId] || '';

            setMessages((prev) => {
              const existing = prev.find((m) => m.id === event.messageId);

              if (existing) {
                return prev.map((m) => {
                  if (m.id !== event.messageId) return m;

                  const newParts = [...m.parts];
                  if (needsNewPart) {
                    // Create new text part at the end (after tool results)
                    newParts.push(createTextPart(newContent));
                  } else {
                    // Find the LAST text part to update (iterate backwards)
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
                      // No text part yet, create one
                      newParts.push(createTextPart(newContent));
                    }
                  }

                  return { ...m, parts: newParts };
                });
              } else {
                // Message doesn't exist - create new
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

            // Generate a new part ID when starting a new reasoning segment
            // This ID is used to track which part to update (handles React state timing)
            let targetPartId = currentReasoningPartIdRef.current[event.messageId];
            let shouldCreatePart = false;

            if (needsNewPart) {
              // Reset flag and clear accumulator for new reasoning segment
              needsNewReasoningPartRef.current[event.messageId] = false;
              accumulatedReasoningRef.current[event.messageId] = '';
              // Generate new part ID for this segment
              targetPartId = generatePartId();
              currentReasoningPartIdRef.current[event.messageId] = targetPartId;
              // Mark that we're creating a new part (prevents duplicates from batching)
              creatingNewReasoningPartRef.current[event.messageId] = true;
              shouldCreatePart = true;
            }

            // Append the delta
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

                  // Try to find the reasoning part by ID first (handles state timing)
                  let reasoningPartIndex = -1;
                  if (targetPartId) {
                    reasoningPartIndex = newParts.findIndex(
                      (p) => p.type === 'reasoning' && p.id === targetPartId
                    );
                  }

                  if (reasoningPartIndex >= 0) {
                    // Found the target part, update it
                    const existingPart = newParts[reasoningPartIndex];
                    if (existingPart) {
                      newParts[reasoningPartIndex] = {
                        ...existingPart,
                        content: currentReasoning,
                      } as ReasoningPart;
                    }
                    // Part exists now, clear the creating flag
                    creatingNewReasoningPartRef.current[event.messageId] = false;
                  } else if (shouldCreatePart) {
                    // Only the first delta (shouldCreatePart=true) creates the new part
                    const newPart = createReasoningPart(currentReasoning);
                    if (targetPartId) {
                      newPart.id = targetPartId;
                    }
                    newParts.push(newPart);
                  } else if (creatingNewReasoningPartRef.current[event.messageId]) {
                    // We're in the middle of creating a part but state hasn't updated yet
                    // DON'T create another part - the delta that set shouldCreatePart=true will create it
                    // Just wait for state to catch up; the accumulator already has the latest content
                    // Once state commits, future deltas will find the part by ID
                  } else if (!targetPartId) {
                    // No target ID yet (first delta in message), find or create
                    let lastReasoningIndex = -1;
                    for (let i = newParts.length - 1; i >= 0; i--) {
                      if (newParts[i]?.type === 'reasoning') {
                        lastReasoningIndex = i;
                        break;
                      }
                    }

                    if (lastReasoningIndex >= 0) {
                      const existingPart = newParts[lastReasoningIndex];
                      if (existingPart) {
                        newParts[lastReasoningIndex] = {
                          ...existingPart,
                          content: currentReasoning,
                        } as ReasoningPart;
                        // Track this part for future updates
                        currentReasoningPartIdRef.current[event.messageId] = existingPart.id;
                      }
                    } else {
                      // No reasoning part yet, create one
                      const newPart = createReasoningPart(currentReasoning);
                      currentReasoningPartIdRef.current[event.messageId] = newPart.id;
                      newParts.push(newPart);
                    }
                  } else {
                    // Have targetPartId but part not found - wait for state to catch up
                    // Don't create duplicate, just update accumulator (already done above)
                    // The part should appear once state commits
                  }

                  return { ...m, parts: newParts };
                });
              } else {
                // Message doesn't exist - create new
                const newPart = createReasoningPart(currentReasoning);
                if (targetPartId) {
                  newPart.id = targetPartId;
                }
                currentReasoningPartIdRef.current[event.messageId] = newPart.id;
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

            // Update thinking status with current reasoning content
            setThinkingStatus({
              isThinking: true,
              detail: currentReasoning,
            });
            break;
          }

          case 'tool_call_start': {
            // Mark that next text_delta/reasoning_delta needs a new part
            needsNewTextPartRef.current[event.messageId] = true;
            needsNewReasoningPartRef.current[event.messageId] = true;
            // Track tool name for artifact detection
            toolNamesByCallIdRef.current[event.toolCallId] = event.toolName;
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
                // Create assistant message if it doesn't exist
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
                  // Update tool invocation state and add result part
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
                // Create assistant message if it doesn't exist
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
            // Check if this was a resource-creating tool and notify
            {
              const toolName = toolNamesByCallIdRef.current[event.toolCallId];
              const resourceTools = [
                'writeArtifact',
                'webSearch',
                'extractContent',
              ];
              if (
                toolName &&
                resourceTools.includes(toolName) &&
                !event.isError
              ) {
                onResourceCreated?.();
              }
              // Clean up after use to prevent memory growth in long sessions
              delete toolNamesByCallIdRef.current[event.toolCallId];
            }
            break;

          case 'message_complete':
            // Skip historical terminal events for messages loaded from DB
            // This prevents history replay from resetting streaming status
            if (loadedMessageIdsRef.current.has(event.messageId)) {
              break;
            }
            setStatus('ready');
            setThinkingStatus({ isThinking: false });
            // Clean up accumulators
            delete accumulatedTextRef.current[event.messageId];
            delete accumulatedReasoningRef.current[event.messageId];
            delete needsNewTextPartRef.current[event.messageId];
            delete needsNewReasoningPartRef.current[event.messageId];
            delete currentReasoningPartIdRef.current[event.messageId];

            // Keep reasoning parts expanded after streaming is complete
            // (no auto-collapse)

            // Don't update currentContextTokens from streaming event - the provider's
            // promptTokens is inflated due to multiple tool call rounds.
            // Let the session query refresh provide the accurate value (contextWindowUsage
            // calculated from breakdown total).
            break;

          case 'error': {
            // Skip historical terminal events for messages loaded from DB
            if (loadedMessageIdsRef.current.has(event.messageId)) {
              break;
            }
            setStatus('error');
            setThinkingStatus({ isThinking: false });
            console.error('Stream error:', event.error, event.code);
            // Create TaskError from stream event
            const taskError: TaskError = {
              type: mapErrorCodeToType(event.code),
              message: event.error,
              retryable: event.retryable ?? true,
              details: event.details,
            };
            setError(taskError);
            break;
          }

          case 'interrupted':
            // Skip historical terminal events for messages loaded from DB
            if (loadedMessageIdsRef.current.has(event.messageId)) {
              break;
            }
            setStatus('ready');
            setThinkingStatus({ isThinking: false });
            currentPlaceholderIdRef.current = null;
            // Clean up empty placeholder messages (no content was streamed)
            setMessages((prev) =>
              prev.filter(
                (m) => !(m.role === 'assistant' && m.parts.length === 0)
              )
            );
            break;

          case 'client_tool_request':
            // Handle client-side tool request from agent
            onClientToolRequest?.({
              toolName: event.toolName,
              requestId: event.requestId,
              params: event.params,
              requiresResponse: event.requiresResponse,
            });
            break;

          case 'spawn_session_created':
            // Update the spawnAgent tool invocation part with the spawned sessionId
            // This enables the "Open Full View" button to work while the sub-agent is still running
            setMessages((prev) => {
              // Check if the tool invocation part exists
              const msg = prev.find((m) => m.id === event.messageId);
              const toolInvocationExists = msg?.parts.some(
                (p) =>
                  p.type === 'tool_invocation' &&
                  (p as ToolInvocationPart).toolCallId === event.toolCallId
              );

              if (!toolInvocationExists) {
                // tool_call_start hasn't arrived yet, store for later
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
                    if (part.type !== 'tool_invocation') return part;
                    if (
                      (part as ToolInvocationPart).toolCallId !==
                      event.toolCallId
                    )
                      return part;
                    return {
                      ...part,
                      args: {
                        ...(part as ToolInvocationPart).args,
                        spawnedSessionId: event.spawnedSessionId,
                      },
                    };
                  }),
                };
              });
            });
            break;

          case 'tool_approval_requested':
            // Update tool invocation state to pending_approval and store approvalId
            setMessages((prev) => {
              return prev.map((m) => {
                if (m.id !== event.messageId) return m;
                return {
                  ...m,
                  parts: m.parts.map((part) => {
                    if (part.type !== 'tool_invocation') return part;
                    if (
                      (part as ToolInvocationPart).toolCallId !==
                      event.toolCallId
                    )
                      return part;
                    return {
                      ...part,
                      state: 'pending_approval' as const,
                      args: {
                        ...(part as ToolInvocationPart).args,
                        _approvalId: event.approvalId,
                      },
                    };
                  }),
                };
              });
            });
            // Stop thinking indicator since we're waiting for approval
            setStatus('ready');
            setThinkingStatus({ isThinking: false });
            break;

          case 'tool_approval_responded':
            // Mark that next text_delta/reasoning_delta needs a new part
            // This ensures content after the approval response appears after the tool
            needsNewTextPartRef.current[event.messageId] = true;
            needsNewReasoningPartRef.current[event.messageId] = true;

            // Update tool invocation state based on approval response
            setMessages((prev) => {
              return prev.map((m) => {
                if (m.id !== event.messageId) return m;
                return {
                  ...m,
                  parts: m.parts.map((part) => {
                    if (part.type !== 'tool_invocation') return part;
                    const toolPart = part as ToolInvocationPart;
                    // Find the tool by matching approvalId stored in args
                    if (toolPart.args?._approvalId !== event.approvalId)
                      return part;

                    if (event.approved) {
                      // Approved: transition to running state, preserve approval status
                      const { _approvalId: _, ...restArgs } = toolPart.args || {};
                      return {
                        ...part,
                        state: 'running' as const,
                        args: restArgs,
                        approvalStatus: 'approved' as const,
                        approvedByUserId: event.approvedByUserId,
                        approvedAt: event.approvedAt,
                      };
                    } else {
                      // Denied: transition to error state with denial message
                      const { _approvalId: _, ...restArgs } = toolPart.args || {};
                      return {
                        ...part,
                        state: 'error' as const,
                        args: restArgs,
                        approvalStatus: 'denied' as const,
                        approvalDenialReason: event.denialReason || 'User denied this action',
                        approvedByUserId: event.approvedByUserId,
                        approvedAt: event.approvedAt,
                      };
                    }
                  }),
                };
              });
            });

            if (event.approved) {
              // If approved, agent will continue - show thinking indicator
              setStatus('streaming');
              setThinkingStatus({ isThinking: true });
            }
            break;
        }
      },
      onError: (error) => {
        console.error('[AgentSession] Subscription error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Connection to server lost';

        // Don't show error for temporary WebSocket disconnects
        // The WebSocket client will auto-reconnect with retryDelayMs
        // But DO show error if reconnection has been failing for too long
        if (errorMessage.includes('WebSocket closed')) {
          const wsState = deps.getConnectionState();
          // Show error after 5+ failed reconnection attempts
          if (wsState.reconnectAttempts < 5) {
            console.log(
              '[AgentSession] WebSocket closed, waiting for reconnection...'
            );
            setThinkingStatus({ isThinking: false });
            return;
          }
          // Fall through to show error after too many attempts
        }

        setError({
          type: 'network',
          message: errorMessage,
          retryable: true,
        });
        setStatus('error');
        setThinkingStatus({ isThinking: false });
      },
    }
  );

  // Log subscription status changes
  useEffect(() => {
    console.log('[AgentSession] Subscription status:', {
      sessionId,
      status: subscription.status,
      error: subscription.error,
    });
  }, [sessionId, subscription.status, subscription.error]);

  // Recover from network errors when WebSocket reconnects
  // When subscription becomes idle again after an error, clear the error state
  useEffect(() => {
    if (
      subscription.status === 'idle' &&
      sessionQuery.isSuccess &&
      error?.type === 'network'
    ) {
      console.log('[AgentSession] Recovered from network error');
      setError(null);
      setStatus('ready');
    }
  }, [subscription.status, sessionQuery.isSuccess, error]);

  // Internal function to actually send the message
  // Uses optimistic update - add user message immediately, replace when server confirms
  const doSendMessage = useCallback(
    async (content: string, targetSessionId: string) => {
      console.log('[AgentSession] Sending:', { targetSessionId, content });

      // Clear any previous error when sending a new message
      setError(null);
      // Track the message for retry functionality
      lastMessageRef.current = content;

      // Add optimistic user message and placeholder assistant message for responsive UI
      // Skip if an optimistic message with same content already exists (from queued message)
      setMessages((prev) => {
        const optimisticId = `optimistic-${Date.now()}`;
        const optimisticMessage: TaskMessage = {
          id: optimisticId,
          role: 'user',
          parts: [createTextPart(content)],
          createdAt: new Date(),
        };

        return [...prev, optimisticMessage];
      });

      // Set thinking indicator immediately for responsive UI
      setThinkingStatus({ isThinking: true });
      setStatus('submitted');

      setIsLoading(true);

      // Scroll to the new message (last message before spacer)
      requestAnimationFrame(() => {
        const newMessage = messageListRef.current?.children[
          messageListRef.current.children.length - 1
        ] as HTMLDivElement | undefined;

        newMessage?.scrollIntoView({
          behavior: 'instant',
          block: 'start',
        });
      });

      try {
        await sendMutation.mutateAsync({
          sessionId: targetSessionId,
          content,
        });
      } catch (err) {
        console.error('Failed to send message:', err);
        setStatus('error');
        setThinkingStatus({ isThinking: false });
        setError({
          type: 'api',
          message:
            err instanceof Error ? err.message : 'Failed to send message',
          retryable: true,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [sendMutation]
  );

  const sendMessage = useCallback(
    async (content: string, overrideSessionId?: string) => {
      const targetSessionId = overrideSessionId ?? sessionId;
      if (!targetSessionId) return;

      // Send message immediately without waiting for subscription
      // With replayHistory=true, subscription will catch all events when it connects
      await doSendMessage(content, targetSessionId);
    },
    [sessionId, doSendMessage]
  );

  const interrupt = useCallback(async () => {
    if (!sessionId) return;

    try {
      await interruptMutation.mutateAsync({ sessionId });
    } catch (err) {
      console.error('Failed to interrupt:', err);
    }
  }, [sessionId, interruptMutation]);

  const retry = useCallback(async () => {
    if (!sessionId || !lastMessageRef.current) return;
    // Resend the last message
    await sendMessage(lastMessageRef.current);
  }, [sessionId, sendMessage]);

  const dismissError = useCallback(() => {
    setError(null);
    setStatus('ready');
  }, []);

  // Callback for MessageList to report scroll position changes
  // Used to disable autoscroll when user has scrolled away from bottom
  const handleScrollPositionChange = useCallback((isAtBottom: boolean) => {
    const shouldShow = !isAtBottom;
    setShowScrollButton(shouldShow);
    showScrollButtonRef.current = shouldShow;
  }, []);

  // Calculate context usage
  // - `used`: from latest streaming event (currentContextTokens) or server's currentContextTokens
  // - Accumulated values: from sessionQuery.data.usage (server is source of truth)
  // - `total`: from agent's maxContextTokens config, or model's default, or fallback to 200K
  const DEFAULT_CONTEXT_WINDOW = 200000;
  const agentMaxContext =
    sessionQuery.data?.maxContextTokens ?? DEFAULT_CONTEXT_WINDOW;
  const sessionUsage = sessionQuery.data?.usage as
    | {
        promptTokens?: number;
        completionTokens?: number;
        estimatedCost?: number;
        cacheReadTokens?: number;
        cacheWriteTokens?: number;
        currentContextTokens?: number;
        tokenBreakdown?: {
          systemPrompt: number;
          toolDefinitions: number;
          conversationHistory: number;
          toolResults: number;
          userInput: number;
          completion?: number;
        };
      }
    | undefined;
  // Prefer streaming event's currentContextTokens (most up-to-date during streaming),
  // fall back to server's currentContextTokens, then 0
  const usedContext =
    currentContextTokens || sessionUsage?.currentContextTokens || 0;
  const contextUsage: ContextUsage | null =
    sessionUsage || currentContextTokens
      ? {
          used: usedContext,
          total: agentMaxContext,
          percentage: (usedContext / agentMaxContext) * 100,
          // Accumulated values from server (read-only, don't modify locally)
          promptTokens: sessionUsage?.promptTokens ?? 0,
          completionTokens: sessionUsage?.completionTokens ?? 0,
          estimatedCost: sessionUsage?.estimatedCost ?? 0,
          cacheReadTokens: sessionUsage?.cacheReadTokens ?? 0,
          cacheWriteTokens: sessionUsage?.cacheWriteTokens ?? 0,
          // Token breakdown for context visualization
          tokenBreakdown: sessionUsage?.tokenBreakdown,
        }
      : null;

  // Track last event time to detect stale streaming state
  const lastEventTimeRef = useRef<number>(Date.now());

  // Track when we entered streaming state to avoid reacting to stale query data
  const [streamingStartTime, setStreamingStartTime] = useState<number | null>(
    null
  );

  // Update last event time on any streaming event
  useEffect(() => {
    if (status === 'streaming') {
      lastEventTimeRef.current = Date.now();
    }
  }, [status, messages]); // messages changes on each event

  // Reset streaming start time when status goes to non-streaming/ready states
  // The start time is now set in message_start handler or from session data on page load
  useEffect(() => {
    if (status !== 'streaming' && status !== 'ready') {
      setStreamingStartTime(null);
    }
  }, [status]);

  // Initialize streaming start time from session data on page load
  // This ensures the "Running for" timer persists across page refreshes
  useEffect(() => {
    if (sessionQuery.data?.isStreaming && !streamingStartTime) {
      const streamingMessage = sessionQuery.data.messages
        ?.filter((m) => m.role === 'assistant' && m.status === 'streaming')
        .pop();

      if (streamingMessage?.createdAt) {
        setStreamingStartTime(new Date(streamingMessage.createdAt).getTime());
      }
    }
  }, [
    sessionQuery.data?.isStreaming,
    sessionQuery.data?.messages,
    streamingStartTime,
  ]);

  // Watch streaming state from server - enabled when we're in streaming state
  // This query gets invalidated by useCacheInvalidation when streaming_state_changed is received
  const streamingStateQuery = trpc.sessions.isStreaming.useQuery(
    { sessionId: sessionId! },
    {
      enabled: status === 'streaming' && !!sessionId,
      staleTime: 0, // Always refetch when invalidated
      refetchOnWindowFocus: false, // Avoid unnecessary refetches
    }
  );

  // React to streaming state changes from server pub/sub
  // When server reports streaming stopped but we're still in streaming status, reset
  // Add grace period to avoid reacting to stale query data from previous message
  const STREAMING_QUERY_GRACE_PERIOD_MS = 2000;

  useEffect(() => {
    if (
      status === 'streaming' &&
      streamingStateQuery.data === false &&
      !streamingStateQuery.isLoading
    ) {
      // Only react if we've been in streaming state long enough for the query to be fresh
      const streamingDuration = streamingStartTime
        ? Date.now() - streamingStartTime
        : 0;

      if (streamingDuration > STREAMING_QUERY_GRACE_PERIOD_MS) {
        console.log(
          '[AgentSession] Server reports streaming stopped via pub/sub, resetting status'
        );
        setStatus('ready');
        setThinkingStatus({ isThinking: false });
      }
    }
  }, [
    status,
    streamingStateQuery.data,
    streamingStateQuery.isLoading,
    streamingStartTime,
  ]);

  // Recovery timeout: If status is 'streaming' for too long without events,
  // query the server to verify the streaming state is still active
  // This is a fallback in case pub/sub events are missed
  const STREAMING_RECOVERY_TIMEOUT_MS = 30000; // 30 seconds
  const utils = trpc.useUtils();

  useEffect(() => {
    if (status !== 'streaming' || !sessionId) {
      return;
    }

    const checkStreamingState = async () => {
      try {
        // Query the server for the authoritative streaming state
        const isStillStreaming = await utils.sessions.isStreaming.fetch({
          sessionId,
        });

        if (!isStillStreaming) {
          console.log(
            '[AgentSession] Recovery timeout: Server reports streaming stopped, resetting status'
          );
          setStatus('ready');
          setThinkingStatus({ isThinking: false });
        }
      } catch (err) {
        console.error(
          '[AgentSession] Recovery: Failed to check streaming state:',
          err
        );
      }
    };

    // Start timeout to check streaming state
    const timeout = setTimeout(() => {
      // Only check if no events received recently
      const timeSinceLastEvent = Date.now() - lastEventTimeRef.current;
      if (timeSinceLastEvent > STREAMING_RECOVERY_TIMEOUT_MS) {
        checkStreamingState();
      }
    }, STREAMING_RECOVERY_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [status, sessionId, utils]);

  // Calculate completed duration from messages (stable across page refreshes)
  const completedDuration = useMemo(
    () => calculateCompletedDuration(messages, status !== 'streaming'),
    [status, messages]
  );

  // Detect if there's a pending tool approval.
  // Note: We only check the last assistant message because the AI SDK's needsApproval
  // flow pauses the stream when approval is needed, so there can only be one pending
  // approval at a time per session. The stream resumes after approval/denial.
  const pendingApproval = useMemo(() => {
    if (messages.length === 0) return null;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'assistant') return null;

    const pendingPart = lastMsg.parts.find(
      (p): p is ToolInvocationPart =>
        p.type === 'tool_invocation' &&
        (p as ToolInvocationPart).state === 'pending_approval'
    );

    if (!pendingPart) return null;

    // Extract approvalId from args (stored during tool_approval_requested event)
    const approvalId = pendingPart.args?._approvalId as string | undefined;
    if (!approvalId) return null;

    return {
      messageId: lastMsg.id,
      approvalId,
      toolCallId: pendingPart.toolCallId,
      toolName: pendingPart.toolName,
      args: pendingPart.args,
    };
  }, [messages]);

  // Handle approval/denial of pending tool
  const handleApproval = useCallback(
    async (approved: boolean) => {
      if (!sessionId || !pendingApproval?.approvalId) return;

      try {
        await approvalMutation.mutateAsync({
          sessionId,
          approvalId: pendingApproval.approvalId,
          approved,
          denialReason: approved ? undefined : 'User denied this action',
        });
      } catch (err) {
        console.error('Failed to submit approval:', err);
        setError({
          type: 'api',
          message:
            err instanceof Error ? err.message : 'Failed to submit approval',
          retryable: true,
        });
      }
    },
    [sessionId, pendingApproval?.approvalId, approvalMutation]
  );

  return {
    messages,
    status,
    thinkingStatus,
    sendMessage,
    interrupt,
    isLoading,
    error,
    retry,
    dismissError,
    contextUsage,
    setMessageListRef,
    handleScrollPositionChange,
    showScrollButton,
    sessionAgentId: sessionQuery.data?.agentId ?? null,
    todos,
    streamingStartTime,
    completedDuration,
    pendingApproval,
    handleApproval,
    isApprovalLoading: approvalMutation.isPending,
  };
}
