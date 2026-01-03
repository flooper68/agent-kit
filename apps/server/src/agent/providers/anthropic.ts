import { streamText, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type {
  AgentProvider,
  StreamConfig,
  ProviderStreamEvent,
} from '../types';
import { classifyError } from '../errors';
import { logger } from '../logger';

/**
 * Thinking budget configuration per model.
 * Models not listed here will not have thinking enabled.
 * Budget is in tokens.
 */
const THINKING_BUDGET_BY_MODEL: Record<string, number> = {
  'claude-sonnet-4-20250514': 10000,
  'claude-opus-4-20250514': 16000,
  // Add more models as needed
};

/**
 * Default thinking budget for models that support thinking but aren't explicitly configured.
 * Set to 0 to disable thinking by default.
 */
const DEFAULT_THINKING_BUDGET = 10000;

/**
 * Get the thinking configuration for a model.
 * Returns undefined if thinking should be disabled for the model.
 */
function getThinkingConfig(
  model: string
): { type: 'enabled'; budgetTokens: number } | undefined {
  // Check if model is explicitly configured
  const configuredBudget = THINKING_BUDGET_BY_MODEL[model];
  if (configuredBudget !== undefined) {
    return { type: 'enabled', budgetTokens: configuredBudget };
  }

  // For Claude models with extended thinking support, use default budget
  if (model.includes('claude-sonnet-4') || model.includes('claude-opus-4')) {
    return { type: 'enabled', budgetTokens: DEFAULT_THINKING_BUDGET };
  }

  // Disable thinking for other models
  return undefined;
}

export class AnthropicProvider implements AgentProvider {
  id = 'anthropic';

  async *createStream(
    config: StreamConfig
  ): AsyncIterable<ProviderStreamEvent> {
    const { model, systemPrompt, messages, tools, abortSignal } = config;
    const timer = logger.startTimer();
    const toolNames = Object.keys(tools);

    logger.debug('Starting Anthropic stream', {
      model,
      provider: this.id,
      toolName: toolNames.join(', '),
    });

    try {
      const thinkingConfig = getThinkingConfig(model);

      const result = streamText({
        model: anthropic(model),
        system: systemPrompt,
        messages,
        tools,
        abortSignal,
        stopWhen: stepCountIs(2000),
        providerOptions: thinkingConfig
          ? {
              anthropic: {
                thinking: thinkingConfig,
              },
            }
          : undefined,
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
