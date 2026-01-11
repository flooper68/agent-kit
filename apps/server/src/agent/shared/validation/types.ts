/**
 * Validation error types for agent configuration.
 * These provide structured errors for frontend display.
 */

export type ValidationErrorCode =
  | 'UNKNOWN_MODEL'
  | 'MODEL_PROVIDER_MISMATCH'
  | 'INVALID_TOOLS'
  | 'THINKING_NOT_SUPPORTED'
  | 'INVALID_THINKING_LEVEL'
  | 'THINKING_BUDGET_OUT_OF_RANGE'
  | 'MAX_OUTPUT_TOKENS_EXCEEDED'
  | 'MAX_CONTEXT_TOKENS_EXCEEDED'
  | 'MAX_CONTEXT_TOKENS_TOO_LOW'
  | 'WEB_SEARCH_NOT_SUPPORTED';

/**
 * Field-level validation error for inline display
 */
export interface ValidationFieldError {
  code: ValidationErrorCode;
  /** Dot-notation path to the form field, e.g., 'thinkingConfig.budgetTokens' */
  field: string;
  /** Human-readable error message */
  message: string;
  /** Actionable suggestion for fixing the error */
  suggestion?: string;
  /** Constraints for UI display (ranges, allowed values) */
  constraints?: {
    min?: number;
    max?: number;
    allowed?: string[];
  };
}

/**
 * Result of validating an agent configuration
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationFieldError[];
}
