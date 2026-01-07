import { query } from '@anthropic-ai/claude-code';
import { mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type {
  AgentRunParams,
  AgentRunResult,
  AgentUsage,
  StreamEvent,
  ClaudeCodeHandlerConfig,
} from '../types';
import { SDKMessageMapper } from './message-mapper';
import { reconstructConversationFromEvents } from './conversation-builder';
import { createLogger } from '../logger';
import { createArtifactMcpServer } from '../artifact-mcp-server';
import { createServerToolsMcpServer } from '../server-tools-mcp-server';
import type { ArtifactToolRelay } from '../artifact-tool-relay';
import type { ServerToolRelay } from '../server-tool-relay';

export interface ClaudeCodeProviderConfig extends ClaudeCodeHandlerConfig {
  /** Logger name prefix */
  loggerName: string;
  /** Artifact tool relay for communicating with the server (optional, legacy) */
  artifactRelay?: ArtifactToolRelay;
  /** Server tool relay for all server operations (supersedes artifactRelay) */
  serverRelay?: ServerToolRelay;
}

/**
 * Claude Code SDK provider that handles the common query execution flow.
 * Encapsulates SDK interaction, message mapping, and event streaming.
 */
export class ClaudeCodeProvider {
  private config: ClaudeCodeProviderConfig;
  private mapper: SDKMessageMapper;
  private log: ReturnType<typeof createLogger>;

  constructor(config: ClaudeCodeProviderConfig) {
    this.config = config;
    this.mapper = new SDKMessageMapper(
      config.loggerName,
      config.errorCodePrefix ?? 'CLAUDE_CODE'
    );
    this.log = createLogger(config.loggerName);
  }

  /**
   * Execute a query using the Claude Code SDK.
   * Yields StreamEvent objects as the SDK processes the request.
   */
  async *run(
    params: AgentRunParams
  ): AsyncGenerator<StreamEvent, AgentRunResult, undefined> {
    const { sessionId, messageId, content, messages, events, abortSignal } =
      params;
    const startTime = Date.now();
    let messageCount = 0;
    let eventCount = 0;

    // Determine cwd: use isolated temp directory or configured cwd
    let effectiveCwd: string;
    if (this.config.useIsolatedSessionCwd) {
      // Create session-specific temp directory to avoid loading any Claude config files
      // This prevents .claude.md and other settings from affecting the agent
      effectiveCwd = join(tmpdir(), `agent-kit-session-${sessionId}`);
      mkdirSync(effectiveCwd, { recursive: true });
    } else {
      effectiveCwd = this.config.cwd;
    }

    this.log.info('Starting query', {
      sessionId: sessionId.slice(0, 8) + '...',
      messageId: messageId.slice(0, 8) + '...',
      promptLength: content.length,
      cwd: effectiveCwd,
      useIsolatedSessionCwd: this.config.useIsolatedSessionCwd ?? false,
      model: this.config.model ?? 'default',
      maxThinkingTokens: this.config.maxThinkingTokens,
      includePartialMessages: this.config.includePartialMessages,
    });

    // Reset mapper state for this new message run
    // This ensures we properly track stream events vs assistant messages
    this.mapper.resetState();

    // Emit message_start event
    yield { type: 'message_start' };
    eventCount++;
    this.log.debug('Emitted message_start event');

    let finalUsage: AgentUsage | undefined;

    try {
      // Create abort controller from signal
      const abortController = new AbortController();
      abortSignal.addEventListener('abort', () => abortController.abort());

      this.log.debug('Calling query() SDK function', {
        messagesCount: messages.length,
        eventsCount: events.length,
        hasHistory: messages.length > 0,
      });

      // Build prompt with conversation context
      const prompt = this.buildPrompt(content, messages, events);

      // Build query options
      const queryOptions: Record<string, unknown> = {
        cwd: effectiveCwd,
        abortController,
        pathToClaudeCodeExecutable: process.env.CLAUDE_CODE_PATH || undefined,
        // Use bypassPermissions for non-interactive mode
        permissionMode: 'bypassPermissions',
      };

      // Add disallowedTools if configured (blocklist approach)
      if (
        this.config.disallowedTools &&
        this.config.disallowedTools.length > 0
      ) {
        queryOptions.disallowedTools = this.config.disallowedTools;
      }

      // Add optional configuration
      if (this.config.model) {
        queryOptions.model = this.config.model;
      }

      // Default maxThinkingTokens to 10000 if not specified
      queryOptions.maxThinkingTokens = this.config.maxThinkingTokens ?? 10000;

      // Default includePartialMessages to true if not specified
      queryOptions.includePartialMessages =
        this.config.includePartialMessages ?? true;

      // Add custom system prompt if configured
      if (this.config.customSystemPrompt) {
        queryOptions.customSystemPrompt = this.config.customSystemPrompt;
      }

      // Configure MCP servers based on enabled tools
      const mcpServers: Record<string, unknown> = {};

      // Add in-process MCP server for server tools if enabled (supersedes artifact tools)
      if (this.config.enableServerTools && this.config.serverRelay) {
        mcpServers['agent-kit-server'] = createServerToolsMcpServer(
          this.config.serverRelay,
          sessionId
        );
        this.log.debug('In-process MCP server configured for all server tools');
      }
      // Add in-process MCP server for artifact tools if enabled (legacy)
      else if (this.config.enableArtifactTools && this.config.artifactRelay) {
        mcpServers['agent-kit-artifacts'] = createArtifactMcpServer(
          this.config.artifactRelay,
          sessionId
        );
        this.log.debug('In-process MCP server configured for artifact tools');
      }

      if (Object.keys(mcpServers).length > 0) {
        queryOptions.mcpServers = mcpServers;
      }

      this.log.debug('Query options configured', {
        hasModel: !!this.config.model,
        hasMaxThinkingTokens: this.config.maxThinkingTokens !== undefined,
        hasIncludePartialMessages: !!this.config.includePartialMessages,
        hasMcpServers: Object.keys(mcpServers).length > 0,
        mcpServerNames: Object.keys(mcpServers),
      });

      const queryResult = query({
        prompt,
        options: queryOptions,
      });

      this.log.debug('Starting async iteration over query results');

      for await (const message of queryResult) {
        messageCount++;

        // Check for abort
        if (abortSignal.aborted) {
          this.log.info('Abort signal detected, emitting interrupted event', {
            messagesProcessed: messageCount,
          });
          yield { type: 'interrupted' };
          return { usage: finalUsage };
        }

        // Log SDK message details
        const msgType = (message as { type?: string }).type ?? 'unknown';
        this.log.debug(`Processing SDK message #${messageCount}`, {
          type: msgType,
          hasContent:
            msgType === 'assistant'
              ? !!(message as { message?: { content?: unknown[] } }).message
                  ?.content?.length
              : undefined,
        });

        // Map SDK message to server events
        const mappedEvents = this.mapper.mapMessage(message);

        this.log.debug(`Mapped message to ${mappedEvents.length} event(s)`, {
          eventTypes: mappedEvents.map((e) => e.type),
        });

        for (const event of mappedEvents) {
          eventCount++;

          // Capture usage from message_complete event
          if (event.type === 'message_complete' && event.usage) {
            finalUsage = event.usage;
            this.log.debug('Captured usage from message_complete', {
              usage: finalUsage,
            });
          }

          yield event;
        }
      }

      const duration = Date.now() - startTime;
      this.log.info('Query iteration completed successfully', {
        durationMs: duration,
        sdkMessages: messageCount,
        eventsEmitted: eventCount,
        usage: finalUsage,
      });

      return { usage: finalUsage };
    } catch (error) {
      const duration = Date.now() - startTime;

      if (abortSignal.aborted) {
        this.log.info('Query aborted by user', {
          durationMs: duration,
          messagesProcessed: messageCount,
        });
        yield { type: 'interrupted' };
        return { usage: finalUsage };
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.log.error('Query failed with error', {
        durationMs: duration,
        messagesProcessed: messageCount,
        error: errorMessage,
        stack: errorStack,
        errorType: error?.constructor?.name,
      });

      yield {
        type: 'error',
        error: errorMessage,
        code: `${this.config.errorCodePrefix ?? 'CLAUDE_CODE'}_ERROR`,
        retryable: true,
      };

      return { usage: finalUsage };
    }
  }

  /**
   * Build the prompt with optional conversation context
   */
  private buildPrompt(
    content: string,
    messages: AgentRunParams['messages'],
    events: AgentRunParams['events']
  ): string {
    if (messages.length === 0) {
      this.log.debug('Using simple prompt for first message');
      return content;
    }

    // Reconstruct conversation history from events
    this.log.debug('Reconstructing conversation from events');
    const conversationContext = reconstructConversationFromEvents(
      messages,
      events
    );

    // Include conversation context with current message
    const prompt = `<conversation_history>
${conversationContext}
</conversation_history>

Current user message: ${content}`;

    this.log.debug('Using conversation context with current message', {
      contextLength: conversationContext.length,
      fullPromptLength: prompt.length,
    });

    return prompt;
  }
}
