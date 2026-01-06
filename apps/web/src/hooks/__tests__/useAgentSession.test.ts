import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAgentSession } from '../useAgentSession';
import {
  createMockAgentSessionDeps,
  createEvent,
  createEventWithId,
  resetEventCounter,
} from '../../test/mocks/createMockAgentSessionDeps';
import type { TextPart } from '@agent-kit/ui';

describe('useAgentSession', () => {
  beforeEach(() => {
    resetEventCounter();
    vi.clearAllMocks();
  });

  describe('normal streaming flow', () => {
    it('should accumulate text deltas correctly', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
        lastStreamId: 'stream-100',
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      act(() => {
        subscriptionControl.emit(
          createEvent('message_start', 'msg-1', {} as Record<string, never>)
        );
      });

      expect(result.current.status).toBe('streaming');

      act(() => {
        subscriptionControl.emit(
          createEvent('text_delta', 'msg-1', { delta: 'Hello' })
        );
      });

      act(() => {
        subscriptionControl.emit(
          createEvent('text_delta', 'msg-1', { delta: ' World' })
        );
      });

      const msg = result.current.messages.find((m) => m.id === 'msg-1');
      expect(msg).toBeDefined();
      const textPart = msg?.parts[0] as TextPart | undefined;
      expect(textPart?.type).toBe('text');
      expect(textPart?.content).toBe('Hello World');
    });

    it('should handle reasoning deltas and update thinking status', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      act(() => {
        subscriptionControl.emit(
          createEvent('message_start', 'msg-1', {} as Record<string, never>)
        );
        subscriptionControl.emit(
          createEvent('reasoning_delta', 'msg-1', { delta: 'Thinking...' })
        );
      });

      expect(result.current.thinkingStatus.isThinking).toBe(true);
      // Note: detail is updated asynchronously, check that reasoning is in message
      const msg = result.current.messages.find((m) => m.id === 'msg-1');
      expect(msg?.parts[0]?.type).toBe('reasoning');
    });

    it('should complete message and reset status', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      act(() => {
        subscriptionControl.emit(
          createEvent('message_start', 'msg-1', {} as Record<string, never>)
        );
        subscriptionControl.emit(
          createEvent('text_delta', 'msg-1', { delta: 'Hello' })
        );
        subscriptionControl.emit(
          createEvent('message_complete', 'msg-1', {
            usage: {
              promptTokens: 10,
              completionTokens: 5,
              estimatedCost: 0.001,
            },
          })
        );
      });

      expect(result.current.status).toBe('ready');
      expect(result.current.thinkingStatus.isThinking).toBe(false);
    });
  });

  describe('duplication prevention (THE BUG FIX)', () => {
    it('should NOT duplicate deltas when same events are received twice', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
        lastStreamId: 'stream-100',
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      // First batch with specific IDs
      const evt1 = createEventWithId(
        'evt-123',
        'message_start',
        'msg-1',
        {} as Record<string, never>
      );
      const evt2 = createEventWithId('evt-124', 'text_delta', 'msg-1', {
        delta: 'Hello',
      });

      act(() => {
        subscriptionControl.emit(evt1);
        subscriptionControl.emit(evt2);
      });

      const firstContent = (
        result.current.messages.find((m) => m.id === 'msg-1')?.parts[0] as
          | TextPart
          | undefined
      )?.content;
      expect(firstContent).toBe('Hello');

      // Same events replayed (simulating subscription reconnect)
      act(() => {
        subscriptionControl.emit(evt1); // Same ID
        subscriptionControl.emit(evt2); // Same ID
      });

      // Content should NOT be duplicated
      const afterReplay = (
        result.current.messages.find((m) => m.id === 'msg-1')?.parts[0] as
          | TextPart
          | undefined
      )?.content;
      expect(afterReplay).toBe('Hello'); // NOT 'HelloHello'
    });

    it('should process new events after duplicate rejection', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
        lastStreamId: 'stream-100',
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      // First event
      const evt1 = createEventWithId(
        'evt-1',
        'message_start',
        'msg-1',
        {} as Record<string, never>
      );
      const evt2 = createEventWithId('evt-2', 'text_delta', 'msg-1', {
        delta: 'First',
      });

      act(() => {
        subscriptionControl.emit(evt1);
        subscriptionControl.emit(evt2);
      });

      // Replay same events
      act(() => {
        subscriptionControl.emit(evt1);
        subscriptionControl.emit(evt2);
      });

      // New event should still work
      act(() => {
        subscriptionControl.emit(
          createEventWithId('evt-3', 'text_delta', 'msg-1', {
            delta: ' Second',
          })
        );
      });

      const content = (
        result.current.messages.find((m) => m.id === 'msg-1')?.parts[0] as
          | TextPart
          | undefined
      )?.content;
      expect(content).toBe('First Second');
    });
  });

  describe('session switching', () => {
    it('should clear state when switching sessions', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
      });

      const { result, rerender } = renderHook(
        ({ sessionId }) => useAgentSession({ sessionId }, deps),
        { initialProps: { sessionId: 'session-1' as string | null } }
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      act(() => {
        subscriptionControl.emit(
          createEvent('message_start', 'msg-1', {} as Record<string, never>)
        );
        subscriptionControl.emit(
          createEvent('text_delta', 'msg-1', { delta: 'Hello' })
        );
      });

      expect(result.current.messages.length).toBe(1);

      // Switch to new session (no data for this session)
      rerender({ sessionId: 'session-2' });

      // Messages should be cleared (loading state for new session)
      expect(result.current.messages).toEqual([]);
    });

    it('should reset processed event IDs when switching sessions', async () => {
      const { deps, subscriptionControl, setSessionData } =
        createMockAgentSessionDeps({
          id: 'session-1',
          messages: [],
        });

      const { result, rerender } = renderHook(
        ({ sessionId }) => useAgentSession({ sessionId }, deps),
        { initialProps: { sessionId: 'session-1' as string | null } }
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      // Process events in session-1 with specific IDs
      const sharedEventId = 'shared-evt-1';
      const sharedDeltaId = 'shared-delta-1';
      act(() => {
        subscriptionControl.emit(
          createEventWithId(
            sharedEventId,
            'message_start',
            'msg-1',
            {} as Record<string, never>
          )
        );
        subscriptionControl.emit(
          createEventWithId(sharedDeltaId, 'text_delta', 'msg-1', {
            delta: 'Hello',
          })
        );
      });

      // Verify message was created in session-1
      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0]?.id).toBe('msg-1');

      // Switch to session-2
      setSessionData({
        id: 'session-2',
        agentId: 'test-agent',
        messages: [],
        isStreaming: false,
      });
      rerender({ sessionId: 'session-2' });

      await waitFor(() => expect(result.current.messages).toEqual([]));

      // Same event IDs in session-2 should NOT be blocked
      // (processed IDs should have been cleared on session switch)
      act(() => {
        subscriptionControl.emit({
          id: sharedEventId,
          type: 'message_start',
          sessionId: 'session-2',
          messageId: 'msg-2',
          timestamp: new Date().toISOString(),
        });
        subscriptionControl.emit({
          id: sharedDeltaId,
          type: 'text_delta',
          sessionId: 'session-2',
          messageId: 'msg-2',
          timestamp: new Date().toISOString(),
          delta: 'World',
        });
      });

      // Event should be processed (message created with content)
      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0]?.id).toBe('msg-2');
    });
  });

  describe('error handling', () => {
    it('should handle stream error events', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      act(() => {
        subscriptionControl.emit({
          id: 'evt-err',
          type: 'error',
          sessionId: 'session-1',
          messageId: 'msg-1',
          timestamp: new Date().toISOString(),
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT',
          retryable: true,
        });
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.type).toBe('rate_limit');
    });

    it('should dismiss error on dismissError call', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      // Trigger error via stream error event
      act(() => {
        subscriptionControl.emit({
          id: 'evt-err',
          type: 'error',
          sessionId: 'session-1',
          messageId: 'msg-1',
          timestamp: new Date().toISOString(),
          error: 'Test error',
          code: 'TEST_ERROR',
          retryable: true,
        });
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.status).toBe('error');

      act(() => {
        result.current.dismissError();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.status).toBe('ready');
    });
  });

  describe('tool handling', () => {
    it('should add tool invocation and result parts', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      act(() => {
        subscriptionControl.emit(
          createEvent('message_start', 'msg-1', {} as Record<string, never>)
        );
        subscriptionControl.emit(
          createEvent('text_delta', 'msg-1', { delta: 'Let me search' })
        );
        subscriptionControl.emit(
          createEvent('tool_call_start', 'msg-1', {
            toolCallId: 'call-1',
            toolName: 'search',
          })
        );
      });

      const msg = result.current.messages.find((m) => m.id === 'msg-1');
      expect(msg?.parts).toHaveLength(2); // text, tool_invocation
      expect(msg?.parts[1]?.type).toBe('tool_invocation');

      act(() => {
        subscriptionControl.emit(
          createEvent('tool_result', 'msg-1', {
            toolCallId: 'call-1',
            result: { data: 'search results' },
          })
        );
      });

      const msgAfterResult = result.current.messages.find(
        (m) => m.id === 'msg-1'
      );
      expect(msgAfterResult?.parts).toHaveLength(3); // text, tool_invocation, tool_result
      expect(msgAfterResult?.parts[2]?.type).toBe('tool_result');
    });

    it('should create new text part after tool calls', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      // Emit events in separate acts to allow state updates to process
      act(() => {
        subscriptionControl.emit(
          createEvent('message_start', 'msg-1', {} as Record<string, never>)
        );
      });

      act(() => {
        subscriptionControl.emit(
          createEvent('text_delta', 'msg-1', { delta: 'Before tool' })
        );
      });

      act(() => {
        subscriptionControl.emit(
          createEvent('tool_call_start', 'msg-1', {
            toolCallId: 'call-1',
            toolName: 'search',
          })
        );
      });

      act(() => {
        subscriptionControl.emit(
          createEvent('tool_result', 'msg-1', {
            toolCallId: 'call-1',
            result: { data: 'result' },
          })
        );
      });

      act(() => {
        subscriptionControl.emit(
          createEvent('text_delta', 'msg-1', { delta: 'After tool' })
        );
      });

      const msg = result.current.messages.find((m) => m.id === 'msg-1');
      expect(msg?.parts).toHaveLength(4); // text, tool_invocation, tool_result, text

      // First text part
      expect(msg?.parts[0]).toMatchObject({
        type: 'text',
        content: 'Before tool',
      });

      // Last text part (new one after tool)
      expect(msg?.parts[3]).toMatchObject({
        type: 'text',
        content: 'After tool',
      });
    });

    it('should pass tool args through during streaming', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      act(() => {
        subscriptionControl.emit(
          createEvent('message_start', 'msg-1', {} as Record<string, never>)
        );
        subscriptionControl.emit(
          createEvent('tool_call_start', 'msg-1', {
            toolCallId: 'call-1',
            toolName: 'search',
            toolArgs: { query: 'test query', limit: 10 },
          })
        );
      });

      const msg = result.current.messages.find((m) => m.id === 'msg-1');
      expect(msg?.parts).toHaveLength(1);
      expect(msg?.parts[0]).toMatchObject({
        type: 'tool_invocation',
        toolCallId: 'call-1',
        toolName: 'search',
        args: { query: 'test query', limit: 10 },
        state: 'running',
      });
    });

    it('should default tool args to empty object when not provided', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      act(() => {
        subscriptionControl.emit(
          createEvent('message_start', 'msg-1', {} as Record<string, never>)
        );
        subscriptionControl.emit(
          createEvent('tool_call_start', 'msg-1', {
            toolCallId: 'call-1',
            toolName: 'search',
            // No toolArgs provided
          })
        );
      });

      const msg = result.current.messages.find((m) => m.id === 'msg-1');
      expect(msg?.parts).toHaveLength(1);
      expect(msg?.parts[0]).toMatchObject({
        type: 'tool_invocation',
        toolCallId: 'call-1',
        toolName: 'search',
        args: {},
        state: 'running',
      });
    });
  });

  describe('user message handling', () => {
    it('should replace optimistic message with real one', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      // Simulate sending a message (adds optimistic message)
      act(() => {
        result.current.sendMessage('Hello');
      });

      // Wait for optimistic message to appear
      await waitFor(() => {
        const userMsg = result.current.messages.find((m) => m.role === 'user');
        return userMsg !== undefined;
      });

      // Server confirms the message with real ID
      act(() => {
        subscriptionControl.emit({
          id: 'evt-user-1',
          type: 'user_message_created',
          sessionId: 'session-1',
          messageId: 'real-msg-id',
          timestamp: new Date().toISOString(),
          content: 'Hello',
        });
      });

      // Optimistic should be replaced with real
      const userMsg = result.current.messages.find((m) => m.role === 'user');
      expect(userMsg?.id).toBe('real-msg-id');
    });
  });

  describe('interruption handling', () => {
    it('should handle interrupted event', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      act(() => {
        subscriptionControl.emit(
          createEvent('message_start', 'msg-1', {} as Record<string, never>)
        );
      });

      expect(result.current.status).toBe('streaming');

      act(() => {
        subscriptionControl.emit(
          createEvent('interrupted', 'msg-1', {} as Record<string, never>)
        );
      });

      expect(result.current.status).toBe('ready');
      expect(result.current.thinkingStatus.isThinking).toBe(false);
    });
  });

  describe('usage tracking', () => {
    it('should accumulate usage across messages', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          estimatedCost: 0.01,
        },
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.contextUsage).not.toBeNull());

      // Initial usage from session
      expect(result.current.contextUsage?.promptTokens).toBe(100);
      expect(result.current.contextUsage?.completionTokens).toBe(50);

      // Add more usage from a message
      act(() => {
        subscriptionControl.emit(
          createEvent('message_start', 'msg-1', {} as Record<string, never>)
        );
        subscriptionControl.emit(
          createEvent('message_complete', 'msg-1', {
            usage: {
              promptTokens: 20,
              completionTokens: 10,
              estimatedCost: 0.002,
            },
          })
        );
      });

      // Should be accumulated
      expect(result.current.contextUsage?.promptTokens).toBe(120);
      expect(result.current.contextUsage?.completionTokens).toBe(60);
    });
  });

  describe('first message in new session (no lastStreamId)', () => {
    it('should NOT duplicate text on first message', async () => {
      // Test with brand new session - no lastStreamId (undefined)
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
        lastStreamId: undefined, // NEW SESSION - no lastStreamId
        isStreaming: false,
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      // First message in new session
      act(() => {
        subscriptionControl.emit(
          createEvent('message_start', 'msg-1', {} as Record<string, never>)
        );
      });

      expect(result.current.status).toBe('streaming');

      // Emit text deltas
      act(() => {
        subscriptionControl.emit(
          createEvent('text_delta', 'msg-1', { delta: 'Hello' })
        );
      });

      act(() => {
        subscriptionControl.emit(
          createEvent('text_delta', 'msg-1', { delta: ' World' })
        );
      });

      // Verify NO duplication - should be "Hello World", not "Hello World Hello World"
      const msg = result.current.messages.find((m) => m.id === 'msg-1');
      expect(msg).toBeDefined();
      const textPart = msg?.parts[0] as TextPart | undefined;
      expect(textPart?.type).toBe('text');
      expect(textPart?.content).toBe('Hello World');
    });

    it('should handle rapid duplicate events from StrictMode double-subscription', async () => {
      // Simulate StrictMode by emitting events twice with same IDs rapidly
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
        lastStreamId: undefined,
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      // Create events with explicit IDs
      const evt1 = createEventWithId(
        'evt-strict-1',
        'message_start',
        'msg-1',
        {} as Record<string, never>
      );
      const evt2 = createEventWithId('evt-strict-2', 'text_delta', 'msg-1', {
        delta: 'Hello',
      });

      // "First mount" - emit events
      act(() => {
        subscriptionControl.emit(evt1);
        subscriptionControl.emit(evt2);
      });

      // Verify first processing worked
      let content = (
        result.current.messages.find((m) => m.id === 'msg-1')?.parts[0] as
          | TextPart
          | undefined
      )?.content;
      expect(content).toBe('Hello');

      // "Second mount" (StrictMode simulation) - emit SAME events again
      // These should be BLOCKED by deduplication
      act(() => {
        subscriptionControl.emit(evt1);
        subscriptionControl.emit(evt2);
      });

      // Content should NOT be duplicated
      content = (
        result.current.messages.find((m) => m.id === 'msg-1')?.parts[0] as
          | TextPart
          | undefined
      )?.content;
      expect(content).toBe('Hello'); // NOT 'HelloHello'
    });
  });

  describe('StrictMode double-subscription protection', () => {
    it('should handle component unmount/remount without duplicate processing', async () => {
      // This test simulates StrictMode behavior by unmounting and remounting the hook
      // Event ID deduplication handles duplicates from StrictMode double-mounting
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
        lastStreamId: undefined, // New session
      });

      // First mount
      const { result, unmount } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      // Simulate StrictMode: unmount and remount
      unmount();

      // Remount by rendering again
      const { result: result2, unmount: unmount2 } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result2.current.status).toBe('ready'));

      // Start streaming
      act(() => {
        subscriptionControl.emit(
          createEvent('message_start', 'msg-1', {} as Record<string, never>)
        );
      });

      // Emit text deltas
      act(() => {
        subscriptionControl.emit(
          createEvent('text_delta', 'msg-1', { delta: 'Hello' })
        );
      });

      act(() => {
        subscriptionControl.emit(
          createEvent('text_delta', 'msg-1', { delta: ' World' })
        );
      });

      // Content should NOT be duplicated - should be "Hello World" not "Hello WorldHello World"
      const msg = result2.current.messages.find((m) => m.id === 'msg-1');
      expect(msg).toBeDefined();
      const textPart = msg?.parts[0] as TextPart | undefined;
      expect(textPart?.type).toBe('text');
      expect(textPart?.content).toBe('Hello World');

      unmount2();
    });
  });

  describe('pending message timeout', () => {
    it('should queue message when sending to different session', async () => {
      // Test that messages are properly queued when targeting a different session
      const { deps } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
        lastStreamId: undefined,
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      // Send message to a different session (this queues the message)
      await act(async () => {
        result.current.sendMessage('Hello', 'new-session');
      });

      // Should be in 'submitted' state waiting for subscription
      expect(result.current.status).toBe('submitted');
      expect(result.current.thinkingStatus.isThinking).toBe(true);
      // Optimistic message should be added
      expect(result.current.messages.length).toBeGreaterThan(0);
      expect(result.current.messages[0]?.role).toBe('user');
    });
  });

  describe('streaming restoration on page reload', () => {
    it('should restore streaming status when session is actively streaming on load', async () => {
      // Simulate page reload during active streaming
      const { deps } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [
          {
            id: 'msg-1',
            role: 'assistant',
            createdAt: new Date().toISOString(),
            parts: [{ type: 'text', content: 'Hello ' }],
          },
        ],
        lastStreamId: 'stream-100',
        isStreaming: true, // Session is actively streaming
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      // Should immediately show streaming status (not ready)
      await waitFor(() => expect(result.current.status).toBe('streaming'));
      expect(result.current.thinkingStatus.isThinking).toBe(true);
    });

    it('should pass lastStreamId and replayHistory to subscription for active streaming sessions', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [
          {
            id: 'msg-1',
            role: 'assistant',
            createdAt: new Date().toISOString(),
            parts: [{ type: 'text', content: 'Hello ' }],
          },
        ],
        lastStreamId: 'stream-100',
        isStreaming: true,
      });

      renderHook(() => useAgentSession({ sessionId: 'session-1' }, deps));

      // Wait for subscription to be enabled
      await waitFor(() => expect(subscriptionControl.isEnabled()).toBe(true));

      // Subscription should receive lastEventId and replayHistory for full history replay
      expect(subscriptionControl.getLastEventId()).toBe('stream-100');
      expect(subscriptionControl.getReplayHistory()).toBe(true);
    });

    it('should NOT pass lastEventId or replayHistory for non-streaming sessions', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [],
        lastStreamId: 'stream-100',
        isStreaming: false, // Not streaming
      });

      renderHook(() => useAgentSession({ sessionId: 'session-1' }, deps));

      await waitFor(() => expect(subscriptionControl.isEnabled()).toBe(true));

      // Should NOT pass lastEventId or replayHistory for non-streaming session
      expect(subscriptionControl.getLastEventId()).toBeUndefined();
      expect(subscriptionControl.getReplayHistory()).toBe(false);
    });

    it('should initialize text accumulator from existing message content when restoring', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [
          {
            id: 'msg-1',
            role: 'assistant',
            createdAt: new Date().toISOString(),
            parts: [{ type: 'text', content: 'Hello ' }],
          },
        ],
        lastStreamId: 'stream-100',
        isStreaming: true,
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('streaming'));

      // Now receive more text deltas - they should append to existing content
      act(() => {
        subscriptionControl.emit(
          createEvent('text_delta', 'msg-1', { delta: 'World' })
        );
      });

      const msg = result.current.messages.find((m) => m.id === 'msg-1');
      const textPart = msg?.parts[0] as TextPart | undefined;
      // Should be 'Hello World' (existing 'Hello ' + new 'World')
      expect(textPart?.content).toBe('Hello World');
    });

    it('should handle text_delta correctly after restore with tool parts', async () => {
      // Session was interrupted during tool call, now resuming
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [
          {
            id: 'msg-1',
            role: 'assistant',
            createdAt: new Date().toISOString(),
            parts: [
              { type: 'text', content: 'Let me search' },
              {
                type: 'tool_invocation',
                toolCallId: 'call-1',
                toolName: 'search',
                args: {},
                state: 'running',
              },
            ],
          },
        ],
        lastStreamId: 'stream-100',
        isStreaming: true,
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('streaming'));

      // Receive tool result
      act(() => {
        subscriptionControl.emit(
          createEvent('tool_result', 'msg-1', {
            toolCallId: 'call-1',
            result: { data: 'search results' },
          })
        );
      });

      // Receive text after tool - should create NEW text part
      act(() => {
        subscriptionControl.emit(
          createEvent('text_delta', 'msg-1', { delta: 'Found results!' })
        );
      });

      const msg = result.current.messages.find((m) => m.id === 'msg-1');
      // Should have: text, tool_invocation, tool_result, text
      expect(msg?.parts).toHaveLength(4);
      expect(msg?.parts[0]).toMatchObject({
        type: 'text',
        content: 'Let me search',
      });
      expect(msg?.parts[3]).toMatchObject({
        type: 'text',
        content: 'Found results!',
      });
    });

    it('should track existing tool invocations for resource detection', async () => {
      const onResourceCreated = vi.fn();
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [
          {
            id: 'msg-1',
            role: 'assistant',
            createdAt: new Date().toISOString(),
            parts: [
              {
                type: 'tool_invocation',
                toolCallId: 'call-1',
                toolName: 'writeArtifact', // Resource-creating tool
                args: {},
                state: 'running',
              },
            ],
          },
        ],
        lastStreamId: 'stream-100',
        isStreaming: true,
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1', onResourceCreated }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('streaming'));

      // Receive tool result for the writeArtifact tool
      act(() => {
        subscriptionControl.emit(
          createEvent('tool_result', 'msg-1', {
            toolCallId: 'call-1',
            result: { artifactId: 'art-1' },
          })
        );
      });

      // onResourceCreated should be called because writeArtifact is a resource-creating tool
      expect(onResourceCreated).toHaveBeenCalled();
    });

    it('should NOT reset streaming status when receiving historical message_complete events during replay', async () => {
      // This tests the critical bug fix: when restoring a streaming session with replayHistory,
      // historical message_complete events for already-loaded messages should be ignored
      // to prevent resetting the streaming status
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [
          {
            id: 'msg-completed',
            role: 'assistant',
            createdAt: new Date().toISOString(),
            parts: [{ type: 'text', content: 'Previous response' }],
          },
          {
            id: 'msg-streaming',
            role: 'assistant',
            createdAt: new Date().toISOString(),
            parts: [{ type: 'text', content: 'Current streaming...' }],
          },
        ],
        lastStreamId: 'stream-100',
        isStreaming: true,
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('streaming'));
      expect(result.current.thinkingStatus.isThinking).toBe(true);

      // Simulate history replay: receive message_complete for an ALREADY LOADED message
      // This should NOT reset the streaming status
      act(() => {
        subscriptionControl.emit(
          createEvent('message_complete', 'msg-completed', {
            usage: { promptTokens: 10, completionTokens: 5 },
          })
        );
      });

      // Status should still be streaming - the historical event was ignored
      expect(result.current.status).toBe('streaming');
      expect(result.current.thinkingStatus.isThinking).toBe(true);

      // Now receive the actual message_complete for the NEW streaming message
      // This should reset the status because it's not in the loaded message IDs
      act(() => {
        subscriptionControl.emit(
          createEvent('message_complete', 'new-msg-from-live-stream', {
            usage: { promptTokens: 20, completionTokens: 10 },
          })
        );
      });

      // NOW status should be ready
      expect(result.current.status).toBe('ready');
      expect(result.current.thinkingStatus.isThinking).toBe(false);
    });

    it('should NOT reset status on historical error events during replay', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [
          {
            id: 'msg-with-error',
            role: 'assistant',
            createdAt: new Date().toISOString(),
            parts: [{ type: 'text', content: 'Failed message' }],
          },
        ],
        lastStreamId: 'stream-100',
        isStreaming: true,
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('streaming'));

      // Receive historical error event - should be ignored
      act(() => {
        subscriptionControl.emit(
          createEvent('error', 'msg-with-error', {
            error: 'Historical error',
            code: 'TEST_ERROR',
          })
        );
      });

      // Status should still be streaming
      expect(result.current.status).toBe('streaming');
      expect(result.current.error).toBeNull();
    });

    it('should NOT reset status on historical interrupted events during replay', async () => {
      const { deps, subscriptionControl } = createMockAgentSessionDeps({
        id: 'session-1',
        messages: [
          {
            id: 'msg-interrupted',
            role: 'assistant',
            createdAt: new Date().toISOString(),
            parts: [{ type: 'text', content: 'Interrupted message' }],
          },
        ],
        lastStreamId: 'stream-100',
        isStreaming: true,
      });

      const { result } = renderHook(() =>
        useAgentSession({ sessionId: 'session-1' }, deps)
      );

      await waitFor(() => expect(result.current.status).toBe('streaming'));

      // Receive historical interrupted event - should be ignored
      act(() => {
        subscriptionControl.emit(
          createEvent(
            'interrupted',
            'msg-interrupted',
            {} as Record<string, never>
          )
        );
      });

      // Status should still be streaming
      expect(result.current.status).toBe('streaming');
      expect(result.current.thinkingStatus.isThinking).toBe(true);
    });
  });
});
