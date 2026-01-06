import type { Subprocess } from 'bun';
import type {
  AgentRunParams,
  AgentRunResult,
  AgentUsage,
  StreamEvent,
} from '../types';
import { CliEventMapper } from './cli-event-mapper';
import { buildCliArgs } from './cli-args-builder';
import { SessionStore } from './session-store';
import { createLogger } from '../logger';

/**
 * Configuration for the Claude CLI provider.
 */
export interface ClaudeCliProviderConfig {
  /** Working directory for CLI execution */
  cwd: string;
  /** Logger name prefix */
  loggerName: string;
  /** Error code prefix for this provider */
  errorCodePrefix?: string;
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
}

/**
 * Claude CLI provider that spawns the `claude` command as a child process.
 *
 * This provider:
 * - Spawns `claude -p --output-format stream-json` for each run
 * - Parses NDJSON output and maps to StreamEvent types
 * - Supports session resumption via --resume flag
 * - Handles abort signals by killing the child process
 */
export class ClaudeCliProvider {
  private config: ClaudeCliProviderConfig;
  private mapper: CliEventMapper;
  private sessionStore: SessionStore;
  private log: ReturnType<typeof createLogger>;
  private activeProcess: Subprocess | null = null;

  constructor(config: ClaudeCliProviderConfig) {
    this.config = config;
    this.mapper = new CliEventMapper(
      config.loggerName,
      config.errorCodePrefix ?? 'CLAUDE_CLI'
    );
    this.sessionStore = new SessionStore();
    this.log = createLogger(config.loggerName);
  }

  /**
   * Execute a query using the Claude CLI.
   * Yields StreamEvent objects as the CLI processes the request.
   */
  async *run(
    params: AgentRunParams
  ): AsyncGenerator<StreamEvent, AgentRunResult, undefined> {
    const { sessionId, messageId, content, abortSignal } = params;
    const startTime = Date.now();
    let eventCount = 0;
    let finalUsage: AgentUsage | undefined;

    this.log.info('Starting CLI query', {
      sessionId: sessionId.slice(0, 8) + '...',
      messageId: messageId.slice(0, 8) + '...',
      promptLength: content.length,
      cwd: this.config.cwd,
      model: this.config.model ?? 'default',
      maxThinkingTokens: this.config.maxThinkingTokens,
      permissionMode: this.config.permissionMode,
    });

    // Reset mapper state for new run
    this.mapper.reset();

    // Emit message_start event
    yield { type: 'message_start' };
    eventCount++;
    this.log.debug('Emitted message_start event');

    // Track abort handler for cleanup (defined outside try for catch block access)
    let abortHandler: (() => void) | null = null;

    try {
      // Build CLI arguments
      const existingSessionId = this.sessionStore.get(sessionId);

      if (existingSessionId) {
        this.log.info('Resuming existing CLI session', {
          agentSessionId: sessionId.slice(0, 8) + '...',
          cliSessionId: existingSessionId.slice(0, 8) + '...',
          storedSessionsCount: this.sessionStore.size,
        });
      } else {
        this.log.debug('No existing CLI session found, starting fresh', {
          agentSessionId: sessionId.slice(0, 8) + '...',
          storedSessionsCount: this.sessionStore.size,
        });
      }

      const cliArgs = buildCliArgs({
        prompt: content,
        cwd: this.config.cwd,
        model: this.config.model,
        maxThinkingTokens: this.config.maxThinkingTokens,
        allowedTools: this.config.allowedTools,
        disallowedTools: this.config.disallowedTools,
        appendSystemPrompt: this.config.appendSystemPrompt,
        permissionMode: this.config.permissionMode,
        maxTokens: this.config.maxTokens,
        resumeSessionId: existingSessionId,
      });

      this.log.debug('Spawning claude CLI with Bun.spawn', {
        hasResumeSession: !!existingSessionId,
        argsCount: cliArgs.length,
        args: cliArgs.map((arg, i) =>
          i === 1 ? arg.slice(0, 50) + '...' : arg
        ), // Don't log full prompt
      });

      // Use Bun's native spawn for better stream handling
      const proc = Bun.spawn(['claude', ...cliArgs], {
        cwd: this.config.cwd,
        stdout: 'pipe',
        stderr: 'pipe',
        env: {
          ...process.env,
          CI: 'true',
        },
      });
      this.activeProcess = proc;

      this.log.debug('CLI process spawned', {
        pid: proc.pid,
        hasStdout: !!proc.stdout,
        hasStderr: !!proc.stderr,
      });

      // Handle abort signal
      abortHandler = () => {
        this.log.info('Abort signal received, killing process');
        proc.kill();
      };
      abortSignal.addEventListener('abort', abortHandler);

      // Read stderr in background for error reporting (limited to prevent memory exhaustion)
      const MAX_STDERR_SIZE = 100000; // 100KB limit
      let stderrOutput = '';
      const stderrPromise = (async () => {
        if (proc.stderr) {
          const reader = proc.stderr.getReader();
          const decoder = new TextDecoder();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              if (stderrOutput.length < MAX_STDERR_SIZE) {
                stderrOutput += chunk.slice(
                  0,
                  MAX_STDERR_SIZE - stderrOutput.length
                );
              }
              this.log.debug('CLI stderr chunk', {
                chunk: chunk.slice(0, 200),
              });
            }
          } finally {
            reader.releaseLock();
          }
        }
      })();

      this.log.debug('Starting stdout stream reading');

      // Read stdout and process NDJSON lines
      if (proc.stdout) {
        const reader = proc.stdout.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let lineCount = 0;

        try {
          while (true) {
            if (abortSignal.aborted) {
              this.log.info('Abort detected during stream reading');
              yield { type: 'interrupted' };
              reader.releaseLock();
              abortSignal.removeEventListener('abort', abortHandler);
              this.activeProcess = null;
              return { usage: finalUsage };
            }

            const { done, value } = await reader.read();

            if (done) {
              this.log.debug('Stdout stream ended', { lineCount });
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            this.log.debug('CLI stdout chunk received', {
              chunkSize: chunk.length,
              bufferSize: buffer.length,
            });

            // Process complete lines
            let newlineIndex: number;
            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
              const line = buffer.slice(0, newlineIndex);
              buffer = buffer.slice(newlineIndex + 1);
              lineCount++;

              if (line.trim()) {
                this.log.debug('Processing NDJSON line', {
                  lineNumber: lineCount,
                  lineLength: line.length,
                  preview: line.slice(0, 100),
                });

                const mappedEvents = this.mapper.mapLine(line);
                this.log.debug('Mapped events from line', {
                  lineNumber: lineCount,
                  eventCount: mappedEvents.length,
                  eventTypes: mappedEvents.map((e) => e.type),
                });

                for (const event of mappedEvents) {
                  eventCount++;

                  // Handle internal session ID event
                  if (event.type === '_internal_session_id') {
                    this.sessionStore.set(sessionId, event.cliSessionId);
                    this.log.debug('Stored CLI session ID for resumption', {
                      agentSessionId: sessionId.slice(0, 8) + '...',
                    });
                    continue; // Don't yield internal events
                  }

                  // Capture usage from message_complete event
                  if (event.type === 'message_complete' && event.usage) {
                    finalUsage = event.usage;
                    this.log.debug('Captured usage from message_complete', {
                      usage: finalUsage,
                    });
                  }

                  yield event as StreamEvent;
                }
              }
            }
          }

          // Process any remaining buffer
          if (buffer.trim()) {
            this.log.debug('Processing remaining buffer', {
              bufferLength: buffer.length,
            });
            const mappedEvents = this.mapper.mapLine(buffer);
            for (const event of mappedEvents) {
              if (event.type !== '_internal_session_id') {
                yield event as StreamEvent;
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }

      // Wait for process to complete
      const exitCode = await proc.exited;
      await stderrPromise;

      this.log.debug('CLI process exited', { exitCode });

      // Remove abort listener
      abortSignal.removeEventListener('abort', abortHandler);
      this.activeProcess = null;

      // Handle non-zero exit code
      if (exitCode !== 0 && !abortSignal.aborted) {
        const errorMessage =
          stderrOutput.trim() || `CLI exited with code ${exitCode}`;
        this.log.error('CLI exited with non-zero code', {
          exitCode,
          stderr: stderrOutput.slice(0, 200),
        });

        yield {
          type: 'error',
          error: errorMessage,
          code: `${this.config.errorCodePrefix ?? 'CLAUDE_CLI'}_EXIT_ERROR`,
          retryable: true,
        };

        return { usage: finalUsage };
      }

      // Log stderr if present
      if (stderrOutput.trim()) {
        this.log.warn('CLI stderr output', {
          stderr: stderrOutput.slice(0, 500),
        });
      }

      const duration = Date.now() - startTime;
      this.log.info('CLI query completed successfully', {
        durationMs: duration,
        eventsEmitted: eventCount,
        usage: finalUsage,
      });

      return { usage: finalUsage };
    } catch (error) {
      // Clean up process and abort listener
      if (this.activeProcess) {
        this.activeProcess.kill();
        this.activeProcess = null;
      }
      if (abortHandler) {
        abortSignal.removeEventListener('abort', abortHandler);
      }

      if (abortSignal.aborted) {
        this.log.info('Query aborted by user');
        yield { type: 'interrupted' };
        return { usage: finalUsage };
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.log.error('CLI query failed with error', {
        error: errorMessage,
        stack: errorStack,
        errorType: error?.constructor?.name,
      });

      yield {
        type: 'error',
        error: errorMessage,
        code: `${this.config.errorCodePrefix ?? 'CLAUDE_CLI'}_ERROR`,
        retryable: true,
      };

      return { usage: finalUsage };
    }
  }

  /**
   * Get the current session store for testing/debugging.
   */
  getSessionStore(): SessionStore {
    return this.sessionStore;
  }
}
