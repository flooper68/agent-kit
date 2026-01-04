import { useState, useCallback, useEffect, useRef } from 'react';
import { trpc, getConnectionState } from '../lib/trpc';
import type {
  TaskMessage,
  TaskStatus,
  TaskError,
  ThinkingStatus,
  MessagePart,
  TextPart,
  ReasoningPart,
  ToolInvocationPart,
  ToolResultPart,
  ContextUsage,
} from '@agent-kit/ui';

interface UseAgentSessionOptions {
  sessionId: string | null;
  onSessionInvalid?: () => void;
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

export function useAgentSession({
  sessionId,
  onSessionInvalid,
}: UseAgentSessionOptions): UseAgentSessionReturn {
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const hasInitialScrolledRef = useRef<boolean>(false);

  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [status, setStatus] = useState<TaskStatus>('ready');
  const [thinkingStatus, setThinkingStatus] = useState<ThinkingStatus>({
    isThinking: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<TaskError | null>(null);
  const [accumulatedUsage, setAccumulatedUsage] = useState<{
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
  } | null>(null);

  // Track accumulated text for streaming
  const accumulatedTextRef = useRef<Record<string, string>>({});
  const accumulatedReasoningRef = useRef<Record<string, string>>({});
  // Track last user message for retry functionality
  const lastMessageRef = useRef<string | null>(null);
  // Track when a new text part is needed (after tool calls)
  const needsNewTextPartRef = useRef<Record<string, boolean>>({});
  // Track pending message to send once subscription is ready
  const pendingMessageRef = useRef<{
    content: string;
    sessionId: string;
  } | null>(null);

  // Get session data
  const sessionQuery = trpc.sessions.get.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId }
  );

  // Send message mutation
  const sendMutation = trpc.messages.send.useMutation();

  // Interrupt mutation
  const interruptMutation = trpc.messages.interrupt.useMutation();

  // Reset state when sessionId changes
  useEffect(() => {
    // Don't reset if we have a pending message (new session being created)
    if (pendingMessageRef.current) {
      return;
    }

    // Clear messages and reset state when switching sessions
    setMessages([]);
    // Show loading state when switching to an existing chat, ready state for new chat
    setStatus(sessionId ? 'loading' : 'ready');
    setThinkingStatus({ isThinking: false });
    setError(null);
    setAccumulatedUsage(null);
    accumulatedTextRef.current = {};
    accumulatedReasoningRef.current = {};
    needsNewTextPartRef.current = {};
    lastMessageRef.current = null;
    hasInitialScrolledRef.current = false;
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

  const setMessageListRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;

      messageListRef.current = node;

      // Only scroll on initial load of an existing session, not on subsequent updates
      if (sessionQuery.data && !hasInitialScrolledRef.current) {
        hasInitialScrolledRef.current = true;
        const lastMessage = node.children[node.children.length - 1];

        setTimeout(() => {
          lastMessage?.scrollIntoView({ behavior: 'instant' });
        });
      }
    },
    [sessionQuery.data]
  );

  // Initialize accumulated usage from session data when it loads
  useEffect(() => {
    if (sessionQuery.data?.usage) {
      const usage = sessionQuery.data.usage;
      setAccumulatedUsage({
        promptTokens: usage.promptTokens ?? 0,
        completionTokens: usage.completionTokens ?? 0,
        totalTokens: usage.totalTokens ?? 0,
        estimatedCost: usage.estimatedCost ?? 0,
      });
    }
  }, [sessionQuery.data?.usage]);

  // Load initial messages when session loads
  useEffect(() => {
    // Skip if we have a pending message (waiting for subscription to be ready)
    if (pendingMessageRef.current) {
      return;
    }

    if (sessionQuery.data?.messages) {
      const loadedMessages: TaskMessage[] = sessionQuery.data.messages
        .map((msg) => {
          // Convert server parts to UI parts
          const parts: MessagePart[] = [];
          let textContent = '';
          let reasoningContent = '';

          for (const p of msg.parts) {
            switch (p.type) {
              case 'text':
                parts.push(createTextPart(p.content));
                textContent = p.content;
                break;
              case 'reasoning':
                // Keep reasoning blocks expanded when loading from DB
                parts.push(createReasoningPart(p.content, false));
                reasoningContent = p.content;
                break;
              case 'tool_invocation':
                parts.push(
                  createToolInvocationPart(
                    p.toolCallId,
                    p.toolName,
                    p.args,
                    p.state
                  )
                );
                break;
              case 'tool_result':
                parts.push(
                  createToolResultPart(p.toolCallId, p.result, p.isError)
                );
                break;
              // Skip unknown types
            }
          }

          // IMPORTANT: Initialize accumulators with loaded content for assistant messages
          // This ensures that when subscription events arrive, they APPEND to existing
          // content rather than REPLACING it (which would cause content loss on refresh)
          if (msg.role === 'assistant') {
            if (textContent) {
              accumulatedTextRef.current[msg.id] = textContent;
            }
            if (reasoningContent) {
              accumulatedReasoningRef.current[msg.id] = reasoningContent;
            }
          }

          return {
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            parts,
            createdAt: new Date(msg.createdAt),
          };
        })
        // Filter out messages with no parts (empty assistant placeholders)
        .filter((msg) => msg.parts.length > 0);
      setMessages(loadedMessages);
      // Session loaded successfully, set status to ready
      setStatus('ready');
    }
  }, [sessionId, sessionQuery.data?.messages]);

  // Subscribe to session events
  // Historical messages are loaded via sessionQuery, subscription resumes from lastStreamId
  // to ensure no events are missed between the HTTP query and WebSocket connection
  // IMPORTANT: We must wait for sessionQuery to complete so lastStreamId is available
  // before starting the subscription, otherwise it defaults to '$' (new events only)
  const subscription = trpc.messages.subscribe.useSubscription(
    {
      sessionId: sessionId!,
      lastEventId: sessionQuery.data?.lastStreamId,
    },
    {
      enabled: !!sessionId && sessionQuery.isSuccess,
      onData: (event) => {
        console.log('[AgentSession] Event:', event.type, event);
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
            // Initialize accumulator for this message
            accumulatedTextRef.current[event.messageId] = '';
            accumulatedReasoningRef.current[event.messageId] = '';
            needsNewTextPartRef.current[event.messageId] = false;
            break;

          case 'text_delta': {
            const needsNewPart =
              needsNewTextPartRef.current[event.messageId] ?? false;

            if (needsNewPart) {
              // Reset flag and clear accumulator for new segment
              needsNewTextPartRef.current[event.messageId] = false;
              accumulatedTextRef.current[event.messageId] = '';
            }

            accumulatedTextRef.current[event.messageId] =
              (accumulatedTextRef.current[event.messageId] || '') + event.delta;

            setMessages((prev) => {
              const existing = prev.find((m) => m.id === event.messageId);
              const newContent =
                accumulatedTextRef.current[event.messageId] || '';

              if (existing) {
                return prev.map((m) => {
                  if (m.id !== event.messageId) return m;

                  // Keep reasoning parts as-is when text starts streaming
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
            accumulatedReasoningRef.current[event.messageId] =
              (accumulatedReasoningRef.current[event.messageId] || '') +
              event.delta;

            const currentReasoning =
              accumulatedReasoningRef.current[event.messageId] || '';

            setThinkingStatus({
              isThinking: true,
              detail: currentReasoning,
            });

            setMessages((prev) => {
              const existing = prev.find((m) => m.id === event.messageId);

              if (existing) {
                return prev.map((m) => {
                  if (m.id !== event.messageId) return m;

                  // Update or add reasoning part
                  const reasoningPartIndex = m.parts.findIndex(
                    (p) => p.type === 'reasoning'
                  );
                  const newParts = [...m.parts];

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

                  return { ...m, parts: newParts };
                });
              } else {
                // Create assistant message if it doesn't exist
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

          case 'tool_call_start':
            // Mark that next text_delta needs a new text part
            needsNewTextPartRef.current[event.messageId] = true;
            setMessages((prev) => {
              const existing = prev.find((m) => m.id === event.messageId);
              const newPart = createToolInvocationPart(
                event.toolCallId,
                event.toolName,
                {},
                'running'
              );

              if (existing) {
                return prev.map((m) => {
                  if (m.id !== event.messageId) return m;
                  // Keep reasoning parts as-is when tool call starts
                  return { ...m, parts: [...m.parts, newPart] };
                });
              } else {
                // Create assistant message if it doesn't exist (missed message_start)
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

                  // Update the tool invocation state and add result
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
            break;

          case 'message_complete':
            setStatus('ready');
            setThinkingStatus({ isThinking: false });
            // Clean up accumulators
            delete accumulatedTextRef.current[event.messageId];
            delete accumulatedReasoningRef.current[event.messageId];
            delete needsNewTextPartRef.current[event.messageId];

            // Keep reasoning parts expanded after streaming is complete
            // (no auto-collapse)

            // Accumulate usage from this message
            if (event.usage) {
              setAccumulatedUsage((prev) => {
                const currentPrompt = prev?.promptTokens ?? 0;
                const currentCompletion = prev?.completionTokens ?? 0;
                const currentCost = prev?.estimatedCost ?? 0;
                const newPrompt = currentPrompt + event.usage!.promptTokens;
                const newCompletion =
                  currentCompletion + event.usage!.completionTokens;
                const newCost = currentCost + (event.usage!.estimatedCost ?? 0);
                return {
                  promptTokens: newPrompt,
                  completionTokens: newCompletion,
                  totalTokens: newPrompt + newCompletion,
                  estimatedCost: newCost,
                };
              });
            }
            break;

          case 'error': {
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
            setStatus('ready');
            setThinkingStatus({ isThinking: false });
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
          const wsState = getConnectionState();
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

      // Add optimistic user message immediately for responsive UI
      // Skip if an optimistic message with same content already exists (from queued message)
      setMessages((prev) => {
        const alreadyHasOptimistic = prev.some(
          (m) =>
            m.id.startsWith('optimistic-') &&
            m.role === 'user' &&
            m.parts[0]?.type === 'text' &&
            (m.parts[0] as TextPart).content === content
        );
        if (alreadyHasOptimistic) {
          return prev;
        }
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

      // Scroll to show the user's message
      requestAnimationFrame(() => {
        const userMessage = messageListRef.current?.children[
          messageListRef.current.children.length - 2
        ] as HTMLDivElement | undefined;

        userMessage?.scrollIntoView({
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

  // Track if subscription is ready for the current session
  // Subscription is ready when: sessionId matches, query succeeded, and subscription is connected ('idle' status)
  const isSubscriptionReady =
    !!sessionId && sessionQuery.isSuccess && subscription.status === 'idle';

  // Effect to send pending message once subscription is ready
  // This replaces the previous timer-based approach with proper state tracking
  useEffect(() => {
    const pending = pendingMessageRef.current;
    if (pending && sessionId === pending.sessionId && isSubscriptionReady) {
      // Subscription is connected and ready, send the pending message
      pendingMessageRef.current = null;
      doSendMessage(pending.content, pending.sessionId);
    }
  }, [sessionId, isSubscriptionReady, doSendMessage]);

  const sendMessage = useCallback(
    async (content: string, overrideSessionId?: string) => {
      const targetSessionId = overrideSessionId ?? sessionId;
      if (!targetSessionId) return;

      // If using a different session (new session being created), queue the message
      // until subscription is ready for that session
      if (overrideSessionId && overrideSessionId !== sessionId) {
        // Queue message until subscription is ready
        pendingMessageRef.current = {
          content,
          sessionId: overrideSessionId,
        };

        // Add optimistic user message immediately for responsive UI
        const optimisticId = `optimistic-${Date.now()}`;
        const optimisticMessage: TaskMessage = {
          id: optimisticId,
          role: 'user',
          parts: [createTextPart(content)],
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, optimisticMessage]);

        // Set thinking indicator immediately for responsive UI
        setThinkingStatus({ isThinking: true });
        setStatus('submitted');
        return;
      }

      // Subscription is ready, send immediately
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
  // Currently a no-op - can be used in the future for auto-scroll during streaming
  const handleScrollPositionChange = useCallback((_isAtBottom: boolean) => {
    // Intentionally empty - scroll position is tracked by MessageList
    // but not currently used for any conditional behavior
  }, []);

  // Calculate context usage from accumulated state
  const DEFAULT_CONTEXT_WINDOW = 200000;
  const contextUsage: ContextUsage | null = accumulatedUsage
    ? {
        used: accumulatedUsage.totalTokens,
        total: DEFAULT_CONTEXT_WINDOW,
        percentage:
          (accumulatedUsage.totalTokens / DEFAULT_CONTEXT_WINDOW) * 100,
        promptTokens: accumulatedUsage.promptTokens,
        completionTokens: accumulatedUsage.completionTokens,
        estimatedCost: accumulatedUsage.estimatedCost,
      }
    : null;

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
  };
}
