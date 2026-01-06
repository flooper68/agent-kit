/**
 * Options for building CLI arguments.
 */
export interface CliArgsOptions {
  /** The prompt to send to Claude */
  prompt: string;
  /** Working directory for CLI execution */
  cwd: string;
  /** Claude model to use */
  model?: string;
  /** Maximum tokens for extended thinking */
  maxThinkingTokens?: number;
  /** Tools to auto-approve */
  allowedTools?: string[];
  /** Tools to block */
  disallowedTools?: string[];
  /** Custom system prompt to append */
  appendSystemPrompt?: string;
  /** Permission handling mode */
  permissionMode?: 'dangerously-skip-permissions' | 'allowed-tools';
  /** Maximum output tokens */
  maxTokens?: number;
  /** CLI session ID for resuming conversation */
  resumeSessionId?: string;
  /** Path to MCP config JSON file for external tools (e.g., artifact tools) */
  mcpConfigPath?: string;
}

/**
 * Build CLI arguments array for spawning the claude command.
 *
 * @param options - Configuration options
 * @returns Array of command line arguments
 */
export function buildCliArgs(options: CliArgsOptions): string[] {
  const args: string[] = [
    '-p',
    options.prompt, // Prompt flag with value
    '--output-format',
    'stream-json', // NDJSON streaming output
    '--verbose', // Required for stream-json output
    '--include-partial-messages', // Enable real-time streaming of partial message chunks
  ];

  // Model selection
  if (options.model) {
    args.push('--model', options.model);
  }

  // Extended thinking (budget tokens)
  if (
    options.maxThinkingTokens !== undefined &&
    options.maxThinkingTokens > 0
  ) {
    args.push('--max-thinking-tokens', String(options.maxThinkingTokens));
  }

  // Permission handling
  if (options.permissionMode === 'dangerously-skip-permissions') {
    args.push('--dangerously-skip-permissions');
  } else if (
    options.permissionMode === 'allowed-tools' &&
    options.allowedTools &&
    options.allowedTools.length > 0
  ) {
    // Use --allowedTools for granular permission control
    args.push('--allowedTools', options.allowedTools.join(','));
  } else if (
    !options.permissionMode &&
    options.allowedTools &&
    options.allowedTools.length > 0
  ) {
    // Default: if allowed tools provided without mode, use them
    args.push('--allowedTools', options.allowedTools.join(','));
  }

  // Blocked tools
  if (options.disallowedTools && options.disallowedTools.length > 0) {
    args.push('--disallowedTools', options.disallowedTools.join(','));
  }

  // Custom system prompt
  if (options.appendSystemPrompt) {
    args.push('--append-system-prompt', options.appendSystemPrompt);
  }

  // Max output tokens
  if (options.maxTokens !== undefined && options.maxTokens > 0) {
    args.push('--max-tokens', String(options.maxTokens));
  }

  // Session resumption for conversation continuity
  if (options.resumeSessionId) {
    args.push('--resume', options.resumeSessionId);
  }

  // MCP server configuration for external tools (e.g., artifact tools)
  if (options.mcpConfigPath) {
    args.push('--mcp-config', options.mcpConfigPath);
  }

  return args;
}
