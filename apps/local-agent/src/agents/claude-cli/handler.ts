import { ClaudeCliProvider } from '../../lib/claude-cli';
import type {
  AgentHandler,
  AgentRunParams,
  AgentRunResult,
  StreamEvent,
} from '../../lib/types';

/**
 * Configuration for the Claude CLI handler.
 */
export interface ClaudeCliHandlerConfig {
  /** Working directory for CLI execution */
  cwd: string;
  /** Tools to auto-approve (for allowed-tools mode) */
  allowedTools?: string[];
  /** Claude model to use */
  model?: string;
  /** Maximum tokens for extended thinking */
  maxThinkingTokens?: number;
  /** Tools to block */
  disallowedTools?: string[];
  /** Custom system prompt to append */
  appendSystemPrompt?: string;
  /** Permission handling mode */
  permissionMode?: 'dangerously-skip-permissions' | 'allowed-tools';
  /** Maximum output tokens */
  maxTokens?: number;
}

/**
 * Claude CLI handler that spawns the `claude` CLI for each request.
 *
 * This handler enables full Claude Code capabilities including:
 * - All available tools (Read, Write, Edit, Bash, etc.)
 * - Extended thinking mode
 * - Session resumption for multi-turn conversations
 *
 * Use this handler as the main "coding agent" for tasks requiring
 * full file system access and code modification capabilities.
 */
export class ClaudeCliHandler implements AgentHandler {
  readonly id = 'claude-cli';
  private provider: ClaudeCliProvider;

  constructor(config: ClaudeCliHandlerConfig) {
    this.provider = new ClaudeCliProvider({
      ...config,
      loggerName: 'ClaudeCli',
      errorCodePrefix: 'CLAUDE_CLI',
      // Default to dangerously-skip-permissions for full coding agent capabilities
      permissionMode: config.permissionMode ?? 'dangerously-skip-permissions',
    });
  }

  /**
   * Execute a query using the Claude CLI.
   * Yields StreamEvent objects as the CLI processes the request.
   */
  async *run(
    params: AgentRunParams
  ): AsyncGenerator<StreamEvent, AgentRunResult, undefined> {
    return yield* this.provider.run(params);
  }
}
