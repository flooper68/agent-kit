import { ClaudeCodeProvider } from '../../lib/claude-code';
import type { HandlerContext } from '../../lib/handlers';
import type {
  AgentHandler,
  AgentRunParams,
  AgentRunResult,
  StreamEvent,
  ClaudeCodeHandlerConfig,
} from '../../lib/types';

/**
 * Claude Assistant Sonnet handler for brainstorming and planning tasks.
 * Uses Claude Code SDK with all server tools via ServerToolRelay.
 */
export class ClaudeAssistantSonnetHandler implements AgentHandler {
  readonly id = 'claude-assistant-sonnet';
  private provider: ClaudeCodeProvider;

  constructor(config: ClaudeCodeHandlerConfig, context?: HandlerContext) {
    this.provider = new ClaudeCodeProvider({
      ...config,
      loggerName: 'ClaudeAssistantSonnet',
      errorCodePrefix: 'ASSISTANT_SONNET',
      serverRelay: context?.serverRelay,
    });
  }

  async *run(
    params: AgentRunParams
  ): AsyncGenerator<StreamEvent, AgentRunResult, undefined> {
    return yield* this.provider.run(params);
  }
}
