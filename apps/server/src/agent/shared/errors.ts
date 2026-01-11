/**
 * Structured error types for agent operations
 * Provides error classification, retryability info, and detailed context
 */

export type AgentErrorCode =
  | 'PROVIDER_ERROR' // OpenAI/API returned error
  | 'TOOL_ERROR' // Tool execution failed
  | 'TOOL_SCHEMA_ERROR' // Tool schema validation failed
  | 'RATE_LIMIT' // Rate limited by provider
  | 'NETWORK_ERROR' // Network connectivity issue
  | 'TIMEOUT' // Request timeout
  | 'ABORT' // User interrupted
  | 'VALIDATION_ERROR' // Input validation failed
  | 'SESSION_ERROR' // Session not found/invalid
  | 'CONTEXT_LIMIT_REACHED' // Context window limit exceeded
  | 'UNKNOWN'; // Unknown error

export interface AgentErrorDetails {
  statusCode?: number;
  toolName?: string;
  originalError?: string;
  timestamp?: string;
  requestId?: string;
}

export interface AgentError {
  code: AgentErrorCode;
  message: string;
  retryable: boolean;
  details?: AgentErrorDetails;
}

/**
 * Classify an error into a structured AgentError
 * Determines error code, message, and retryability based on error type
 */
export function classifyError(error: unknown): AgentError {
  const timestamp = new Date().toISOString();

  if (error instanceof Error) {
    // AbortError from user interrupt
    if (error.name === 'AbortError') {
      return {
        code: 'ABORT',
        message: 'Request was interrupted',
        retryable: false,
        details: { timestamp },
      };
    }

    // Check for API errors with status codes
    const errorWithStatus = error as Error & {
      status?: number;
      statusCode?: number;
    };
    const status = errorWithStatus.status ?? errorWithStatus.statusCode;

    if (typeof status === 'number') {
      // Rate limit
      if (status === 429) {
        return {
          code: 'RATE_LIMIT',
          message: 'Rate limit exceeded. Please wait before retrying.',
          retryable: true,
          details: { statusCode: status, timestamp },
        };
      }

      // Bad request (includes schema errors)
      if (status === 400) {
        const isSchemaError =
          error.message.includes('schema') ||
          error.message.includes('Invalid schema');
        return {
          code: isSchemaError ? 'TOOL_SCHEMA_ERROR' : 'PROVIDER_ERROR',
          message: error.message,
          retryable: false,
          details: {
            statusCode: status,
            originalError: error.message,
            timestamp,
          },
        };
      }

      // Authentication/Authorization errors
      if (status === 401 || status === 403) {
        return {
          code: 'PROVIDER_ERROR',
          message: 'Authentication failed. Check API credentials.',
          retryable: false,
          details: { statusCode: status, timestamp },
        };
      }

      // Server errors
      if (status >= 500) {
        return {
          code: 'PROVIDER_ERROR',
          message: 'Provider service error. Please retry.',
          retryable: true,
          details: { statusCode: status, timestamp },
        };
      }
    }

    // Network errors
    if (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND')
    ) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        retryable: true,
        details: { originalError: error.message, timestamp },
      };
    }

    // Timeout errors
    if (
      error.message.includes('timeout') ||
      error.message.includes('ETIMEDOUT')
    ) {
      return {
        code: 'TIMEOUT',
        message: 'Request timed out',
        retryable: true,
        details: { originalError: error.message, timestamp },
      };
    }

    // Tool execution errors
    if (error.message.includes('tool') || error.message.includes('function')) {
      return {
        code: 'TOOL_ERROR',
        message: error.message,
        retryable: true,
        details: { originalError: error.message, timestamp },
      };
    }

    // Generic error with message
    return {
      code: 'UNKNOWN',
      message: error.message,
      retryable: true,
      details: { originalError: error.message, timestamp },
    };
  }

  // Non-Error objects
  return {
    code: 'UNKNOWN',
    message: String(error),
    retryable: true,
    details: { originalError: String(error), timestamp },
  };
}

/**
 * Create a tool-specific error
 */
export function createToolError(
  toolName: string,
  message: string,
  isRetryable = true
): AgentError {
  return {
    code: 'TOOL_ERROR',
    message: `Tool '${toolName}' failed: ${message}`,
    retryable: isRetryable,
    details: {
      toolName,
      originalError: message,
      timestamp: new Date().toISOString(),
    },
  };
}
