import { streamText, stepCountIs, type ModelMessage } from 'ai';
import { google } from '@ai-sdk/google';
import type {
  AgentProvider,
  StreamConfig,
  ProviderStreamEvent,
} from '../../shared/types';
import { classifyError } from '../../shared/errors';
import { logger } from '../../shared/logger';
import {
  getModelInfo,
  DEFAULT_THINKING_CONFIG,
  type ThinkingLevel,
} from '../model-config';

/**
 * Default thinking level for Gemini 3 models.
 * Uses 'low' as a safe default that works for both Pro (low/high) and Flash (all levels).
 */
const DEFAULT_THINKING_LEVEL: ThinkingLevel =
  (DEFAULT_THINKING_CONFIG.level.thinkingLevel as ThinkingLevel) ?? 'low';

export class GeminiProvider implements AgentProvider {
  id = 'gemini';

  async *createStream(
    config: StreamConfig
  ): AsyncIterable<ProviderStreamEvent> {
    const {
      model,
      systemPrompt,
      messages,
      tools,
      abortSignal,
      temperature,
      maxTokens,
      thinkingConfig,
    } = config;
    const timer = logger.startTimer();
    const toolNames = Object.keys(tools);

    logger.debug('Starting Gemini stream', {
      model,
      provider: this.id,
      toolName: toolNames.join(', '),
    });

    // Get model info for validation
    const modelInfo = getModelInfo(model);

    // Gemini 3 uses level-based thinking, validate against valid levels for this model
    let providerThinkingConfig:
      | { thinkingLevel: string; includeThoughts: boolean }
      | undefined;

    if (modelInfo?.supportsThinking && thinkingConfig?.enabled !== false) {
      const validLevels = modelInfo.thinkingConstraints
        ?.validThinkingLevels ?? ['low', 'high'];
      let level: ThinkingLevel =
        thinkingConfig?.thinkingLevel ?? DEFAULT_THINKING_LEVEL;

      // Fallback if requested level isn't valid for this model
      // (e.g., 'medium' requested for Gemini 3 Pro which only supports low/high)
      if (!validLevels.includes(level)) {
        const fallbackLevel = validLevels.includes('low')
          ? 'low'
          : validLevels[0];
        logger.warn('Invalid thinking level for model, falling back', {
          model,
          requestedLevel: level,
          fallbackLevel,
          validLevels,
        });
        level = fallbackLevel as ThinkingLevel;
      }

      providerThinkingConfig = { thinkingLevel: level, includeThoughts: true };
    }

    try {
      const result = streamText({
        model: google(model),
        system: systemPrompt,
        messages: messages as ModelMessage[],
        tools,
        abortSignal,
        stopWhen: stepCountIs(2000),
        temperature,
        maxOutputTokens: maxTokens
          ? Math.min(maxTokens, modelInfo?.maxOutputTokens ?? 64000)
          : undefined,
        ...(providerThinkingConfig && {
          providerOptions: {
            google: { thinkingConfig: providerThinkingConfig },
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

          case 'tool-error':
            logger.debug('Tool error received', {
              toolCallId: chunk.toolCallId,
              toolName: chunk.toolName,
              model,
            });
            yield {
              type: 'tool_result',
              toolCallId: chunk.toolCallId,
              result:
                chunk.error instanceof Error
                  ? chunk.error.message
                  : String(chunk.error),
              isError: true,
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
