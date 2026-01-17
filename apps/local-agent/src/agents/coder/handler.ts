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
 * Coder handler for implementing features, fixing bugs, and creating PRs.
 * Uses Claude Code SDK with full file tools (Read, Write, Edit, Glob, Grep).
 */
export class CoderHandler implements AgentHandler {
  readonly id = 'coder';
  private provider: ClaudeCodeProvider;

  constructor(config: ClaudeCodeHandlerConfig, context?: HandlerContext) {
    this.provider = new ClaudeCodeProvider({
      ...config,
      loggerName: 'Coder',
      errorCodePrefix: 'CODER',
      serverRelay: context?.serverRelay,
    });
  }

  async *run(
    params: AgentRunParams
  ): AsyncGenerator<StreamEvent, AgentRunResult, undefined> {
    return yield* this.provider.run(params);
  }
}
