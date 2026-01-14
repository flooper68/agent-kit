import { streamText, stepCountIs, type ModelMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type {
  AgentProvider,
  StreamConfig,
  ProviderStreamEvent,
} from '../types';
import { classifyError } from '../errors';
import { logger } from '../logger';
import { getModelInfo, DEFAULT_THINKING_CONFIG } from '../model-config';

/**
 * Default thinking budget for Anthropic models.
 */
const DEFAULT_THINKING_BUDGET =
  DEFAULT_THINKING_CONFIG.budget.budgetTokens ?? 10000;

export class AnthropicProvider implements AgentProvider {
  id = 'anthropic';

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

    logger.debug('Starting Anthropic stream', {
      model,
      provider: this.id,
      toolName: toolNames.join(', '),
    });

    // Get model info for validation
    const modelInfo = getModelInfo(model);

    // Determine thinking config - use provided or fall back to defaults
    // Thinking is enabled by default for models that support it
    let finalThinkingConfig:
      | { type: 'enabled'; budgetTokens: number }
      | undefined;

    if (modelInfo?.supportsThinking && thinkingConfig?.enabled !== false) {
      finalThinkingConfig = {
        type: 'enabled',
        budgetTokens: thinkingConfig?.budgetTokens ?? DEFAULT_THINKING_BUDGET,
      };
    }

    try {
      const result = streamText({
        model: anthropic(model),
        messages: [
          {
            role: 'system' as const,
            content: systemPrompt,
            providerOptions: {
              anthropic: { cacheControl: { type: 'ephemeral' } },
            },
          },
          ...(messages as ModelMessage[]),
        ],
        tools,
        abortSignal,
        stopWhen: stepCountIs(2000),
        temperature,
        maxOutputTokens: maxTokens
          ? Math.min(maxTokens, modelInfo?.maxOutputTokens ?? 64000)
          : undefined,
        providerOptions: {
          anthropic: {
            ...(finalThinkingConfig && { thinking: finalThinkingConfig }),
            cacheControl: { type: 'ephemeral' }, // Cache tools
          },
        },
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
              providerMetadata: chunk.providerMetadata as
                | Record<string, unknown>
                | undefined,
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

          case 'tool-approval-request':
            logger.debug('Tool approval request received', {
              approvalId: chunk.approvalId,
              toolCallId: chunk.toolCall.toolCallId,
              toolName: chunk.toolCall.toolName,
              model,
            });
            yield {
              type: 'tool_approval_request',
              approvalId: chunk.approvalId,
              toolCallId: chunk.toolCall.toolCallId,
              toolName: chunk.toolCall.toolName,
              toolArgs: (chunk.toolCall.input ?? {}) as Record<string, unknown>,
              providerMetadata: (chunk.toolCall as { providerMetadata?: Record<string, unknown> }).providerMetadata,
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
