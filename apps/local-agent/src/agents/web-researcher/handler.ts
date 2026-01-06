import { ClaudeCodeProvider } from '../../lib/claude-code';
import type {
  AgentHandler,
  AgentRunParams,
  AgentRunResult,
  StreamEvent,
  ClaudeCodeHandlerConfig,
} from '../../lib/types';

/**
 * Web Researcher handler for finding and synthesizing information from the web.
 * Uses Claude Code SDK with web tools (WebFetch, WebSearch).
 */
export class WebResearcherHandler implements AgentHandler {
  readonly id = 'web-researcher';
  private provider: ClaudeCodeProvider;

  constructor(config: ClaudeCodeHandlerConfig) {
    this.provider = new ClaudeCodeProvider({
      ...config,
      loggerName: 'WebResearcher',
      errorCodePrefix: 'WEB_RESEARCHER',
    });
  }

  async *run(
    params: AgentRunParams
  ): AsyncGenerator<StreamEvent, AgentRunResult, undefined> {
    return yield* this.provider.run(params);
  }
}
