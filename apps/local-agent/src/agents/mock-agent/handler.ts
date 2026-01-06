import { createLogger } from '../../lib/logger';
import type { HandlerContext } from '../../lib/handlers';
import type {
  AgentHandler,
  AgentHandlerConfig,
  AgentRunParams,
  AgentRunResult,
  AgentUsage,
  StreamEvent,
} from '../../lib/types';
import { env } from './env';

const log = createLogger('MockAgent');

// Simulated tool definitions with mock-prefixed names
const MOCK_TOOLS = [
  {
    name: 'MockRead',
    description: 'Simulates reading a file',
    exampleArgs: { file_path: '/example/path.ts' },
    exampleResult: `export function example() {
  return "hello world";
}

// This is a mock file content
export const config = {
  name: "example",
  version: "1.0.0"
};`,
  },
  {
    name: 'MockSearch',
    description: 'Simulates searching the web',
    exampleArgs: { query: 'example search query' },
    exampleResult: `Search results for "example search query":

1. **Example Result One** - example.com
   A comprehensive guide to understanding examples and how they work.

2. **Example Result Two** - docs.example.org
   Official documentation with detailed examples and code snippets.

3. **Example Result Three** - blog.example.io
   A blog post discussing best practices for examples.`,
  },
  {
    name: 'MockGrep',
    description: 'Simulates searching file contents',
    exampleArgs: { pattern: 'function', path: '/src' },
    exampleResult: `/src/index.ts:5: function main() {
/src/utils.ts:12: function helper() {
/src/api.ts:23: export function fetchData() {`,
  },
];

/**
 * Mock Agent handler for testing and demos.
 * Simulates the full event flow without calling any AI service.
 */
export class MockAgentHandler implements AgentHandler {
  readonly id = 'mock-agent';
  private config: AgentHandlerConfig;
  private delayMs: number;
  private thinkingEnabled: boolean;
  private toolCallCount: number;

  constructor(config: AgentHandlerConfig, _context?: HandlerContext) {
    this.config = config;
    this.delayMs = env.MOCK_DELAY_MS;
    this.thinkingEnabled = env.MOCK_THINKING_ENABLED;
    this.toolCallCount = env.MOCK_TOOL_CALLS;

    log.debug('MockAgentHandler constructed', {
      cwd: config.cwd,
      delayMs: this.delayMs,
      thinkingEnabled: this.thinkingEnabled,
      toolCallCount: this.toolCallCount,
    });
  }

  async *run(
    params: AgentRunParams
  ): AsyncGenerator<StreamEvent, AgentRunResult, undefined> {
    const { sessionId, content, abortSignal } = params;
    const startTime = Date.now();

    log.info('Mock agent processing', {
      sessionId: sessionId.slice(0, 8) + '...',
      promptLength: content.length,
      promptPreview:
        content.length > 100 ? content.slice(0, 100) + '...' : content,
    });

    // 1. Emit message_start
    yield { type: 'message_start' };
    await this.delay();
    log.debug('Emitted message_start');

    // Check for abort
    if (abortSignal.aborted) {
      yield { type: 'interrupted' };
      return { usage: this.getMockUsage() };
    }

    // 2. Optional: Emit reasoning/thinking
    if (this.thinkingEnabled) {
      yield {
        type: 'reasoning_delta',
        delta: `Let me analyze this request: "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"\n`,
      };
      await this.delay();

      yield {
        type: 'reasoning_delta',
        delta: 'I should use some tools to help answer this question.\n',
      };
      await this.delay();

      yield {
        type: 'reasoning_delta',
        delta: `I'll make ${this.toolCallCount} tool call(s) to gather information.\n`,
      };
      await this.delay();
      log.debug('Emitted reasoning events');
    }

    // Check for abort
    if (abortSignal.aborted) {
      yield { type: 'interrupted' };
      return { usage: this.getMockUsage() };
    }

    // 3. Initial text response
    yield {
      type: 'text_delta',
      delta:
        "I'll help you with that. Let me gather some information first.\n\n",
    };
    await this.delay();
    log.debug('Emitted initial text');

    // 4. Simulate tool calls
    for (let i = 0; i < this.toolCallCount; i++) {
      // Check for abort
      if (abortSignal.aborted) {
        log.info('Abort signal detected during tool calls');
        yield { type: 'interrupted' };
        return { usage: this.getMockUsage() };
      }

      const tool = MOCK_TOOLS[i % MOCK_TOOLS.length]!;
      const toolCallId = `mock_tool_${i}_${Date.now()}`;

      log.debug(`Simulating tool call ${i + 1}/${this.toolCallCount}`, {
        toolName: tool.name,
        toolCallId,
      });

      // Tool call start
      yield {
        type: 'tool_call_start',
        toolCallId,
        toolName: tool.name,
        toolArgs: tool.exampleArgs,
      };
      await this.delay(200); // Longer delay for tool execution

      // Tool result
      yield {
        type: 'tool_result',
        toolCallId,
        result: tool.exampleResult,
        isError: false,
      };
      await this.delay();

      // Post-tool thinking
      if (this.thinkingEnabled) {
        yield {
          type: 'reasoning_delta',
          delta: `I've received the results from ${tool.name}. Let me process this information.\n`,
        };
        await this.delay();
      }
    }

    // Check for abort
    if (abortSignal.aborted) {
      yield { type: 'interrupted' };
      return { usage: this.getMockUsage() };
    }

    // 5. Final response text
    yield {
      type: 'text_delta',
      delta: '\nBased on my analysis, here is what I found:\n\n',
    };
    await this.delay();

    yield {
      type: 'text_delta',
      delta: `1. **First finding**: The mock tools returned sample data that demonstrates the expected output format.\n\n`,
    };
    await this.delay();

    yield {
      type: 'text_delta',
      delta: `2. **Second finding**: This mock agent successfully simulates the full event stream including thinking, tool calls, and text responses.\n\n`,
    };
    await this.delay();

    yield {
      type: 'text_delta',
      delta: `3. **Summary**: Your original request was: "${content.slice(0, 100)}${content.length > 100 ? '...' : ''}"\n\n`,
    };
    await this.delay();

    yield {
      type: 'text_delta',
      delta: `This response was generated by the mock agent for testing and demonstration purposes. No actual AI model was called.`,
    };
    await this.delay();

    log.debug('Emitted final response text');

    // 6. Message complete
    const usage = this.getMockUsage();
    yield {
      type: 'message_complete',
      usage,
      finishReason: 'end_turn',
    };

    const duration = Date.now() - startTime;
    log.info('Mock agent completed', {
      durationMs: duration,
      usage,
    });

    return { usage };
  }

  private async delay(ms?: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms ?? this.delayMs));
  }

  private getMockUsage(): AgentUsage {
    return {
      promptTokens: Math.floor(Math.random() * 500) + 500,
      completionTokens: Math.floor(Math.random() * 300) + 200,
      estimatedCost: 0.001 + Math.random() * 0.002,
    };
  }
}
