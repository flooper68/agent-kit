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
 * Codebase Researcher handler for exploring and analyzing codebases.
 * Uses Claude Code SDK with read-only file tools (Read, Glob, Grep).
 */
export class CodebaseResearcherHandler implements AgentHandler {
  readonly id = 'codebase-researcher';
  private provider: ClaudeCodeProvider;

  constructor(config: ClaudeCodeHandlerConfig, context?: HandlerContext) {
    this.provider = new ClaudeCodeProvider({
      ...config,
      loggerName: 'CodebaseResearcher',
      errorCodePrefix: 'CODEBASE_RESEARCHER',
      artifactRelay: context?.artifactRelay,
    });
  }

  async *run(
    params: AgentRunParams
  ): AsyncGenerator<StreamEvent, AgentRunResult, undefined> {
    return yield* this.provider.run(params);
  }
}
