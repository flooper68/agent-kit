import type {
  ChatMessage,
  ChatStatus,
  ThinkingStatus,
  MessagePart,
  TextPart,
  ToolInvocationPart,
} from '../../../../types/chat';
import {
  generateId,
  createMessage,
  createTextPart,
  createReasoningPart,
  createToolInvocationPart,
} from '../../Integration/mocks/messages';
import type { ChatError } from '../types';
import {
  type MockScenario,
  type MockToolConfig,
  defaultScenarios,
  defaultResponse,
  defaultReasoning,
} from './scenarios';

/**
 * Configuration for the mock chat service
 */
export interface MockChatServiceConfig {
  /** Delay before starting response (ms) */
  thinkingDelay?: number;
  /** Delay between streamed words (ms) */
  streamingWordDelay?: number;
  /** Whether to include reasoning in responses */
  includeReasoning?: boolean;
}

/**
 * Event callbacks for the mock service
 */
export interface MockChatServiceCallbacks {
  onStatusChange: (status: ChatStatus) => void;
  onMessageAdd: (message: ChatMessage) => void;
  onMessageUpdate: (messageId: string, updates: Partial<ChatMessage>) => void;
  onThinkingStatusChange: (status: ThinkingStatus) => void;
  onError: (error: ChatError) => void;
}

/**
 * Mock chat service for Storybook demonstrations
 *
 * Simulates AI chat responses with:
 * - Word-by-word streaming
 * - Tool call execution with state transitions
 * - Error scenarios
 * - Interrupt/retry support
 */
export class MockChatService {
  private config: Required<MockChatServiceConfig>;
  private callbacks: MockChatServiceCallbacks;
  private scenarios: MockScenario[];
  private abortController: AbortController | null = null;
  private messages: ChatMessage[] = [];

  constructor(
    callbacks: MockChatServiceCallbacks,
    config: MockChatServiceConfig = {}
  ) {
    this.callbacks = callbacks;
    this.config = {
      thinkingDelay: config.thinkingDelay ?? 1000,
      streamingWordDelay: config.streamingWordDelay ?? 50,
      includeReasoning: config.includeReasoning ?? false,
    };
    this.scenarios = [...defaultScenarios];
  }

  /**
   * Add a custom scenario (takes priority over defaults)
   */
  addScenario(scenario: MockScenario): void {
    this.scenarios.unshift(scenario);
  }

  /**
   * Send a message and simulate AI response
   */
  async sendMessage(userMessage: string): Promise<void> {
    // Create abort controller for interruption
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // Add user message
    const userMsg = createMessage('user', [createTextPart(userMessage)]);
    this.messages.push(userMsg);
    this.callbacks.onMessageAdd(userMsg);

    // Update status to submitted
    this.callbacks.onStatusChange('submitted');
    this.callbacks.onThinkingStatusChange({
      isThinking: true,
      status: 'Thinking',
    });

    // Check for matching scenario
    const scenario = this.findScenario(userMessage);

    // Simulate thinking delay
    await this.delay(this.config.thinkingDelay, signal);
    if (signal.aborted) return;

    // Handle error scenarios
    if (scenario?.error) {
      this.callbacks.onError({
        type: scenario.error.type as ChatError['type'],
        message: scenario.error.message,
        retryable: true,
      });
      this.callbacks.onStatusChange('error');
      this.callbacks.onThinkingStatusChange({ isThinking: false });
      return;
    }

    // Stop thinking indicator
    this.callbacks.onThinkingStatusChange({ isThinking: false });

    // Build response message parts
    const parts: MessagePart[] = [];

    // Add reasoning if configured or scenario has it
    if (this.config.includeReasoning || scenario?.reasoning) {
      const reasoning = scenario?.reasoning ?? defaultReasoning(userMessage);
      parts.push(createReasoningPart(reasoning, true));
    }

    // Create assistant message
    const assistantMsg = createMessage('assistant', parts);
    this.messages.push(assistantMsg);
    this.callbacks.onMessageAdd(assistantMsg);

    // Handle tool calls
    if (scenario?.tools && scenario.tools.length > 0) {
      await this.executeToolCalls(assistantMsg.id, scenario.tools, signal);
      if (signal.aborted) return;
    }

    // Stream the response text
    this.callbacks.onStatusChange('streaming');
    const responseText = scenario?.response ?? defaultResponse(userMessage);
    await this.streamText(assistantMsg.id, responseText, signal);

    if (signal.aborted) return;

    // Complete
    this.callbacks.onStatusChange('ready');
  }

  /**
   * Interrupt the current response
   */
  interrupt(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      this.callbacks.onStatusChange('ready');
      this.callbacks.onThinkingStatusChange({ isThinking: false });
    }
  }

  /**
   * Retry the last failed message
   */
  async retry(): Promise<void> {
    const lastUserMessage = [...this.messages]
      .reverse()
      .find((m) => m.role === 'user');

    if (lastUserMessage) {
      const textPart = lastUserMessage.parts.find(
        (p): p is TextPart => p.type === 'text'
      );
      if (textPart) {
        // Remove last failed assistant message if any
        const lastMsg = this.messages[this.messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          this.messages.pop();
        }

        // Remove user message (sendMessage will re-add it)
        this.messages.pop();

        // Resend
        await this.sendMessage(textPart.content);
      }
    }
  }

  /**
   * Get current messages
   */
  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  /**
   * Reset all messages and state
   */
  reset(): void {
    this.messages = [];
    this.interrupt();
  }

  // Private methods

  private findScenario(message: string): MockScenario | undefined {
    return this.scenarios.find((s) => {
      if (typeof s.trigger === 'string') {
        return message.toLowerCase().includes(s.trigger.toLowerCase());
      }
      return s.trigger.test(message);
    });
  }

  private async executeToolCalls(
    messageId: string,
    tools: MockToolConfig[],
    signal: AbortSignal
  ): Promise<void> {
    for (const tool of tools) {
      if (signal.aborted) return;

      // Create tool invocation part in pending state
      const toolPart = createToolInvocationPart(
        tool.name,
        tool.args,
        'pending'
      );

      // Add to message
      this.updateMessageParts(messageId, (parts) => [...parts, toolPart]);

      // Small delay then transition to running
      await this.delay(200, signal);
      if (signal.aborted) return;
      this.updateToolState(messageId, toolPart.toolCallId, 'running');

      // Wait for result
      await this.delay(tool.resultDelay ?? 1000, signal);
      if (signal.aborted) return;

      // Complete or error
      this.updateToolState(
        messageId,
        toolPart.toolCallId,
        tool.error ? 'error' : 'completed'
      );
    }
  }

  private async streamText(
    messageId: string,
    text: string,
    signal: AbortSignal
  ): Promise<void> {
    const words = text.split(' ');
    let streamed = '';
    const streamingPartId = generateId();

    // Add initial empty text part
    this.updateMessageParts(messageId, (parts) => [
      ...parts,
      { type: 'text', id: streamingPartId, content: '' } as TextPart,
    ]);

    for (const word of words) {
      if (signal.aborted) return;

      streamed += (streamed ? ' ' : '') + word;

      // Update the text part content directly
      this.updateMessageParts(messageId, (parts) =>
        parts.map((p) =>
          p.id === streamingPartId ? { ...p, content: streamed } : p
        )
      );

      await this.delay(this.config.streamingWordDelay, signal);
    }
  }

  private updateMessageParts(
    messageId: string,
    updater: (parts: MessagePart[]) => MessagePart[]
  ): void {
    const message = this.messages.find((m) => m.id === messageId);
    if (message) {
      message.parts = updater(message.parts);
      this.callbacks.onMessageUpdate(messageId, { parts: message.parts });
    }
  }

  private updateToolState(
    messageId: string,
    toolCallId: string,
    state: ToolInvocationPart['state']
  ): void {
    this.updateMessageParts(messageId, (parts) =>
      parts.map((p) =>
        p.type === 'tool_invocation' && p.toolCallId === toolCallId
          ? { ...p, state }
          : p
      )
    );
  }

  private delay(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(resolve, ms);
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timeout);
          resolve();
        },
        { once: true }
      );
    });
  }
}

// Re-export for convenience
export { generateId };
