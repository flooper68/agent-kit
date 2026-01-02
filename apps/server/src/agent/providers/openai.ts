import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import type {
  AgentProvider,
  StreamConfig,
  ProviderStreamEvent,
} from '../types';

export class OpenAIProvider implements AgentProvider {
  id = 'openai';

  async *createStream(
    config: StreamConfig
  ): AsyncIterable<ProviderStreamEvent> {
    const { model, systemPrompt, messages, tools, abortSignal } = config;

    try {
      const result = streamText({
        model: openai(model),
        system: systemPrompt,
        messages,
        tools,
        abortSignal,
      });

      let accumulatedText = '';

      for await (const chunk of result.fullStream) {
        switch (chunk.type) {
          case 'text-delta':
            // AI SDK v6 uses 'text' instead of 'textDelta'
            accumulatedText += chunk.text;
            yield { type: 'text_delta', content: chunk.text };
            break;

          case 'reasoning-delta':
            // AI SDK v6 reasoning events
            yield { type: 'reasoning_delta', content: chunk.text };
            break;

          case 'tool-call':
            yield {
              type: 'tool_call',
              toolCallId: chunk.toolCallId,
              toolName: chunk.toolName,
              args: (chunk.input ?? {}) as Record<string, unknown>,
            };
            break;

          case 'tool-result':
            yield {
              type: 'tool_result',
              toolCallId: chunk.toolCallId,
              result: chunk.output,
              isError: false,
            };
            break;

          case 'error':
            yield {
              type: 'error',
              error:
                chunk.error instanceof Error
                  ? chunk.error
                  : new Error(String(chunk.error)),
            };
            break;

          case 'finish':
            yield {
              type: 'done',
              text: accumulatedText,
              usage: chunk.totalUsage
                ? {
                    promptTokens:
                      (chunk.totalUsage as { inputTokens?: number })
                        .inputTokens ?? 0,
                    completionTokens:
                      (chunk.totalUsage as { outputTokens?: number })
                        .outputTokens ?? 0,
                  }
                : undefined,
              finishReason: chunk.finishReason,
            };
            break;
        }
      }
    } catch (error) {
      // Handle abort errors gracefully
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      yield {
        type: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}
