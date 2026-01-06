type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_COLORS = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m', // green
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default to 'debug' for verbose logging, can be set via env
const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'debug';

function formatTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace('T', ' ').slice(0, -1);
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[currentLevel];
}

function formatMessage(
  level: LogLevel,
  prefix: string,
  message: string,
  data?: unknown
): string {
  const timestamp = formatTimestamp();
  const levelColor = LOG_COLORS[level];
  const levelStr = level.toUpperCase().padEnd(5);
  const prefixStr = `[${prefix}]`.padEnd(16);

  let formatted = `${LOG_COLORS.dim}${timestamp}${LOG_COLORS.reset} ${levelColor}${levelStr}${LOG_COLORS.reset} ${LOG_COLORS.bold}${prefixStr}${LOG_COLORS.reset} ${message}`;

  if (data !== undefined) {
    if (typeof data === 'object' && data !== null) {
      // Truncate large objects
      const json = JSON.stringify(data, null, 2);
      const truncated =
        json.length > 500 ? json.slice(0, 500) + '... (truncated)' : json;
      formatted += `\n${LOG_COLORS.dim}${truncated}${LOG_COLORS.reset}`;
    } else {
      formatted += ` ${LOG_COLORS.dim}${String(data)}${LOG_COLORS.reset}`;
    }
  }

  return formatted;
}

export class Logger {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  debug(message: string, data?: unknown): void {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', this.prefix, message, data));
    }
  }

  info(message: string, data?: unknown): void {
    if (shouldLog('info')) {
      console.log(formatMessage('info', this.prefix, message, data));
    }
  }

  warn(message: string, data?: unknown): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', this.prefix, message, data));
    }
  }

  error(message: string, data?: unknown): void {
    if (shouldLog('error')) {
      console.error(formatMessage('error', this.prefix, message, data));
    }
  }

  child(subPrefix: string): Logger {
    return new Logger(`${this.prefix}:${subPrefix}`);
  }
}

export function createLogger(prefix: string): Logger {
  return new Logger(prefix);
}

export const logger = createLogger('Agent');
