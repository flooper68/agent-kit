import { useMemo } from 'react';
import { detectSlashCommand, type SlashCommandContext } from '@agent-kit/ui';

// Re-export the type for consumers
export type { SlashCommandContext };

/**
 * Hook to detect when the user is typing a slash command in the input.
 *
 * Returns information about the slash command context, including:
 * - Whether to show the autocomplete dropdown
 * - The current search query (text after the slash)
 * - The position of the slash for text replacement
 *
 * A slash command is detected when:
 * - "/" appears at the start of the input, OR
 * - "/" appears after whitespace or chip placeholder
 *
 * The context ends when:
 * - There's a space after the slash command text (before cursor)
 * - The slash is removed
 *
 * @param inputValue - The current input value
 * @param cursorPosition - Optional cursor position (defaults to end of input)
 */
export function useSlashCommandDetection(
  inputValue: string,
  cursorPosition?: number
): SlashCommandContext {
  return useMemo(
    () => detectSlashCommand(inputValue, cursorPosition),
    [inputValue, cursorPosition]
  );
}
