import { ClaudeCliProvider } from '../../lib/claude-cli';
import type { HandlerContext } from '../../lib/handlers';
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
  /**
   * Permission handling mode (REQUIRED for security).
   * - 'allowed-tools': Only auto-approve tools specified in `allowedTools` array (recommended)
   * - 'dangerously-skip-permissions': Auto-approve ALL tools (use only in fully trusted environments)
   */
  permissionMode: 'dangerously-skip-permissions' | 'allowed-tools';
  /** Tools to auto-approve (required when permissionMode is 'allowed-tools') */
  allowedTools?: string[];
  /** Claude model to use */
  model?: string;
  /** Maximum tokens for extended thinking */
  maxThinkingTokens?: number;
  /** Tools to block */
  disallowedTools?: string[];
  /** Custom system prompt to append */
  appendSystemPrompt?: string;
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
 *
 * SECURITY NOTE: You MUST explicitly set `permissionMode` in config.
 * - 'allowed-tools': Only auto-approve tools specified in `allowedTools` array
 * - 'dangerously-skip-permissions': Auto-approve ALL tools (use only in trusted environments)
 */
export class ClaudeCliHandler implements AgentHandler {
  readonly id = 'claude-cli';
  private provider: ClaudeCliProvider;

  constructor(config: ClaudeCliHandlerConfig, _context?: HandlerContext) {
    // Require explicit permission mode - don't default to dangerous mode
    if (!config.permissionMode) {
      throw new Error(
        'ClaudeCliHandler: permissionMode must be explicitly set. ' +
          'Use "allowed-tools" for controlled access (recommended) or ' +
          '"dangerously-skip-permissions" only in fully trusted environments.'
      );
    }

    // Note: CLI provider doesn't support artifact tools via in-process MCP
    // because it spawns a separate process. Would need external MCP server.
    this.provider = new ClaudeCliProvider({
      ...config,
      loggerName: 'ClaudeCli',
      errorCodePrefix: 'CLAUDE_CLI',
      permissionMode: config.permissionMode,
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
