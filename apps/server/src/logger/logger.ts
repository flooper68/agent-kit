/**
 * Structured logging for agent operations
 * Provides consistent log formatting with context and timing
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  sessionId?: string;
  messageId?: string;
  workerId?: string;
  toolName?: string;
  toolCallId?: string;
  duration?: number;
  model?: string;
  provider?: string;
  code?: string;
  statusCode?: number;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  timestamp: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class AgentLogger {
  private minLevel: LogLevel;

  constructor(minLevel: LogLevel = 'debug') {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatContext(context: LogContext): string {
    const entries = Object.entries(context)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => {
        // Truncate long string values
        if (typeof v === 'string' && v.length > 100) {
          return `${k}="${v.slice(0, 100)}..."`;
        }
        // Format objects as JSON
        if (typeof v === 'object') {
          return `${k}=${JSON.stringify(v)}`;
        }
        return `${k}=${v}`;
      });

    return entries.length > 0 ? ` { ${entries.join(', ')} }` : '';
  }

  private formatEntry(entry: LogEntry): string {
    const { level, message, context, timestamp } = entry;
    const time = timestamp.slice(11, 23); // Extract HH:MM:SS.mmm
    const prefix = `[${time}] [${level.toUpperCase().padEnd(5)}]`;
    const contextStr = this.formatContext(context);

    return `${prefix} ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context: LogContext = {}) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    const formatted = this.formatEntry(entry);

    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }

  /**
   * Create a timer for measuring operation duration
   * Returns a function that returns elapsed milliseconds when called
   */
  startTimer(): () => number {
    const start = performance.now();
    return () => Math.round(performance.now() - start);
  }

  /**
   * Create a child logger with preset context
   * Useful for adding session/worker context to all logs
   */
  child(baseContext: LogContext): ChildLogger {
    return new ChildLogger(this, baseContext);
  }
}

class ChildLogger {
  private parent: AgentLogger;
  private baseContext: LogContext;

  constructor(parent: AgentLogger, baseContext: LogContext) {
    this.parent = parent;
    this.baseContext = baseContext;
  }

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.baseContext, ...context };
  }

  debug(message: string, context?: LogContext) {
    this.parent.debug(message, this.mergeContext(context));
  }

  info(message: string, context?: LogContext) {
    this.parent.info(message, this.mergeContext(context));
  }

  warn(message: string, context?: LogContext) {
    this.parent.warn(message, this.mergeContext(context));
  }

  error(message: string, context?: LogContext) {
    this.parent.error(message, this.mergeContext(context));
  }

  startTimer(): () => number {
    return this.parent.startTimer();
  }
}

// Determine log level from environment
function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  if (envLevel && envLevel in LOG_LEVELS) {
    return envLevel as LogLevel;
  }
  // Default to debug in development, info in production
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

// Export singleton logger instance
export const logger = new AgentLogger(getLogLevel());
