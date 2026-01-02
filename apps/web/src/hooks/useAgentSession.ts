import { useState, useCallback, useEffect, useRef } from 'react';
import { trpc } from '../lib/trpc';
import type {
  TaskMessage,
  TaskStatus,
  ThinkingStatus,
  MessagePart,
  TextPart,
  ReasoningPart,
  ToolInvocationPart,
  ToolResultPart,
} from '@agent-kit/ui';

interface UseAgentSessionOptions {
  sessionId: string | null;
}

interface UseAgentSessionReturn {
  messages: TaskMessage[];
  status: TaskStatus;
  thinkingStatus: ThinkingStatus;
  sendMessage: (content: string, overrideSessionId?: string) => Promise<void>;
  interrupt: () => Promise<void>;
  isLoading: boolean;
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
function createReasoningPart(content: string): ReasoningPart {
  return { type: 'reasoning', id: generatePartId(), content };
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
}: UseAgentSessionOptions): UseAgentSessionReturn {
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [status, setStatus] = useState<TaskStatus>('ready');
  const [thinkingStatus, setThinkingStatus] = useState<ThinkingStatus>({
    isThinking: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Track accumulated text for streaming
  const accumulatedTextRef = useRef<Record<string, string>>({});
  const accumulatedReasoningRef = useRef<Record<string, string>>({});

  // Get session data
  const sessionQuery = trpc.sessions.get.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId }
  );

  // Send message mutation
  const sendMutation = trpc.messages.send.useMutation();

  // Interrupt mutation
  const interruptMutation = trpc.messages.interrupt.useMutation();

  // Load initial messages when session loads
  useEffect(() => {
    if (sessionQuery.data?.messages) {
      const loadedMessages: TaskMessage[] = sessionQuery.data.messages.map(
        (msg) => {
          // Convert server parts to UI parts
          const parts: MessagePart[] = msg.parts.map((p) => {
            switch (p.type) {
              case 'text':
                return createTextPart(p.content);
              case 'reasoning':
                return createReasoningPart(p.content);
              case 'tool_invocation':
                return createToolInvocationPart(
                  p.toolCallId,
                  p.toolName,
                  p.args,
                  p.state
                );
              case 'tool_result':
                return createToolResultPart(p.toolCallId, p.result, p.isError);
              default:
                return createTextPart('');
            }
          });

          return {
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            parts,
            createdAt: new Date(msg.createdAt),
          };
        }
      );
      setMessages(loadedMessages);
    }
  }, [sessionQuery.data?.messages]);

  // Subscribe to session events
  trpc.messages.subscribe.useSubscription(
    { sessionId: sessionId! },
    {
      enabled: !!sessionId,
      onData: (event) => {
        switch (event.type) {
          case 'message_start':
            setStatus('streaming');
            setThinkingStatus({ isThinking: true });
            // Initialize accumulator for this message
            accumulatedTextRef.current[event.messageId] = '';
            accumulatedReasoningRef.current[event.messageId] = '';
            break;

          case 'text_delta':
            accumulatedTextRef.current[event.messageId] =
              (accumulatedTextRef.current[event.messageId] || '') + event.delta;

            setMessages((prev) => {
              const existing = prev.find((m) => m.id === event.messageId);
              const newContent =
                accumulatedTextRef.current[event.messageId] || '';

              if (existing) {
                return prev.map((m) => {
                  if (m.id !== event.messageId) return m;

                  // Update or add text part
                  const textPartIndex = m.parts.findIndex(
                    (p) => p.type === 'text'
                  );
                  const newParts = [...m.parts];

                  if (textPartIndex >= 0) {
                    const existingPart = newParts[textPartIndex];
                    if (existingPart) {
                      newParts[textPartIndex] = {
                        ...existingPart,
                        content: newContent,
                      } as TextPart;
                    }
                  } else {
                    newParts.unshift(createTextPart(newContent));
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

            setMessages((prev) =>
              prev.map((m) => {
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
              })
            );
            break;
          }

          case 'tool_call_start':
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== event.messageId) return m;

                return {
                  ...m,
                  parts: [
                    ...m.parts,
                    createToolInvocationPart(
                      event.toolCallId,
                      event.toolName,
                      {},
                      'running'
                    ),
                  ],
                };
              })
            );
            break;

          case 'tool_result':
            setMessages((prev) =>
              prev.map((m) => {
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

                newParts.push(
                  createToolResultPart(
                    event.toolCallId,
                    event.result,
                    event.isError
                  )
                );

                return { ...m, parts: newParts };
              })
            );
            break;

          case 'message_complete':
            setStatus('ready');
            setThinkingStatus({ isThinking: false });
            // Clean up accumulators
            delete accumulatedTextRef.current[event.messageId];
            delete accumulatedReasoningRef.current[event.messageId];
            break;

          case 'error':
            setStatus('error');
            setThinkingStatus({ isThinking: false });
            console.error('Stream error:', event.error);
            break;

          case 'interrupted':
            setStatus('ready');
            setThinkingStatus({ isThinking: false });
            break;
        }
      },
      onError: (error) => {
        console.error('Subscription error:', error);
        setStatus('error');
        setThinkingStatus({ isThinking: false });
      },
    }
  );

  const sendMessage = useCallback(
    async (content: string, overrideSessionId?: string) => {
      const targetSessionId = overrideSessionId ?? sessionId;
      if (!targetSessionId) return;

      setIsLoading(true);
      try {
        // Add user message optimistically
        const tempId = `temp-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: tempId,
            role: 'user' as const,
            parts: [createTextPart(content)],
            createdAt: new Date(),
          },
        ]);

        const result = await sendMutation.mutateAsync({
          sessionId: targetSessionId,
          content,
        });

        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, id: result.userMessageId } : m
          )
        );
      } catch (error) {
        console.error('Failed to send message:', error);
        setStatus('error');
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, sendMutation]
  );

  const interrupt = useCallback(async () => {
    if (!sessionId) return;

    try {
      await interruptMutation.mutateAsync({ sessionId });
    } catch (error) {
      console.error('Failed to interrupt:', error);
    }
  }, [sessionId, interruptMutation]);

  return {
    messages,
    status,
    thinkingStatus,
    sendMessage,
    interrupt,
    isLoading,
  };
}
