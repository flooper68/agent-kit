import { streamText, stepCountIs, type ModelMessage } from 'ai';
import { google } from '@ai-sdk/google';
import type {
  AgentProvider,
  StreamConfig,
  ProviderStreamEvent,
} from '../types';
import { classifyError } from '../errors';
import { logger } from '../logger';

export class GeminiProvider implements AgentProvider {
  id = 'gemini';

  async *createStream(
    config: StreamConfig
  ): AsyncIterable<ProviderStreamEvent> {
    const { model, systemPrompt, messages, tools, abortSignal } = config;
    const timer = logger.startTimer();
    const toolNames = Object.keys(tools);

    logger.debug('Starting Gemini stream', {
      model,
      provider: this.id,
      toolName: toolNames.join(', '),
    });

    // Gemini 2.5+ and 3 models support thinking
    const isGemini3 = model.includes('gemini-3');
    const isGemini25 = model.includes('gemini-2.5');
    const supportsThinking = isGemini3 || isGemini25;

    try {
      const result = streamText({
        model: google(model),
        system: systemPrompt,
        messages: messages as ModelMessage[],
        tools,
        abortSignal,
        stopWhen: stepCountIs(2000),
        ...(supportsThinking && {
          providerOptions: {
            google: {
              thinkingConfig: isGemini3
                ? { thinkingLevel: 'medium', includeThoughts: true }
                : { thinkingBudget: 8192, includeThoughts: true },
            },
          },
        }),
      });

      let accumulatedText = '';

      for await (const chunk of result.fullStream) {
        switch (chunk.type) {
          case 'text-delta':
            accumulatedText += chunk.text;
            yield { type: 'text_delta', content: chunk.text };
            break;

          case 'reasoning-delta':
            yield { type: 'reasoning_delta', content: chunk.text };
            break;

          case 'tool-call':
            logger.debug('Tool call received', {
              toolName: chunk.toolName,
              toolCallId: chunk.toolCallId,
              model,
            });
            yield {
              type: 'tool_call',
              toolCallId: chunk.toolCallId,
              toolName: chunk.toolName,
              args: (chunk.input ?? {}) as Record<string, unknown>,
            };
            break;

          case 'tool-result':
            logger.debug('Tool result received', {
              toolCallId: chunk.toolCallId,
              model,
            });
            yield {
              type: 'tool_result',
              toolCallId: chunk.toolCallId,
              result: chunk.output,
              isError: false,
            };
            break;

          case 'error': {
            const agentError = classifyError(chunk.error);
            logger.error('Stream error event', {
              code: agentError.code,
              model,
              provider: this.id,
              duration: timer(),
            });
            yield { type: 'error', error: agentError };
            break;
          }

          case 'finish':
            logger.info('Stream completed', {
              model,
              provider: this.id,
              duration: timer(),
            });
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
                    cacheReadTokens:
                      (
                        chunk.totalUsage as {
                          inputTokenDetails?: { cacheReadTokens?: number };
                        }
                      ).inputTokenDetails?.cacheReadTokens ?? undefined,
                    cacheWriteTokens:
                      (
                        chunk.totalUsage as {
                          inputTokenDetails?: { cacheWriteTokens?: number };
                        }
                      ).inputTokenDetails?.cacheWriteTokens ?? undefined,
                  }
                : undefined,
              finishReason: chunk.finishReason,
            };
            break;
        }
      }
    } catch (error) {
      const agentError = classifyError(error);

      // Handle abort errors gracefully - just log and return
      if (agentError.code === 'ABORT') {
        logger.debug('Stream aborted by user', {
          model,
          provider: this.id,
          duration: timer(),
        });
        return;
      }

      logger.error('Stream failed', {
        code: agentError.code,
        model,
        provider: this.id,
        statusCode: agentError.details?.statusCode,
        duration: timer(),
      });

      yield { type: 'error', error: agentError };
    }
  }
}
