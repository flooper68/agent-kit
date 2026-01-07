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
 * Claude Assistant Opus handler for brainstorming and planning tasks.
 * Uses Claude Code SDK with all server tools via ServerToolRelay.
 */
export class ClaudeAssistantOpusHandler implements AgentHandler {
  readonly id = 'claude-assistant-opus';
  private provider: ClaudeCodeProvider;

  constructor(config: ClaudeCodeHandlerConfig, context?: HandlerContext) {
    this.provider = new ClaudeCodeProvider({
      ...config,
      loggerName: 'ClaudeAssistantOpus',
      errorCodePrefix: 'ASSISTANT_OPUS',
      serverRelay: context?.serverRelay,
    });
  }

  async *run(
    params: AgentRunParams
  ): AsyncGenerator<StreamEvent, AgentRunResult, undefined> {
    return yield* this.provider.run(params);
  }
}
