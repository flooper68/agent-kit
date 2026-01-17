/**
 * Utility functions for slash command chip handling.
 * These are pure functions that can be easily unit tested.
 */

import type { SlashCommandChip } from '../Core/RichTextInput';

/** Zero-width space used as chip placeholder in rich text input */
export const CHIP_PLACEHOLDER = '\u200B';

/**
 * Context information for slash command detection.
 */
export interface SlashCommandContext {
  /** Whether we're in a valid slash command context */
  shouldShowAutocomplete: boolean;
  /** The search query to filter commands (text after the slash) */
  searchQuery: string;
  /** Position of the slash character in the input */
  slashIndex: number;
}

/**
 * Detects if the user is typing a slash command in the input.
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
 * @returns Context about the slash command detection
 */
export function detectSlashCommand(
  inputValue: string,
  cursorPosition?: number
): SlashCommandContext {
  // Use cursor position if provided, otherwise use end of string
  const effectiveEnd = cursorPosition ?? inputValue.length;
  const textUpToCursor = inputValue.slice(0, effectiveEnd);

  // Find the last "/" in text up to cursor (not entire input)
  const lastSlashIndex = textUpToCursor.lastIndexOf('/');

  if (lastSlashIndex === -1) {
    return {
      shouldShowAutocomplete: false,
      searchQuery: '',
      slashIndex: -1,
    };
  }

  // Check if "/" is at start or after whitespace/chip placeholder
  const charBefore = textUpToCursor[lastSlashIndex - 1];
  const isValidPosition =
    lastSlashIndex === 0 ||
    charBefore === undefined ||
    /\s/.test(charBefore) ||
    charBefore === CHIP_PLACEHOLDER;

  if (!isValidPosition) {
    return {
      shouldShowAutocomplete: false,
      searchQuery: '',
      slashIndex: -1,
    };
  }

  // Get the text after the slash up to cursor (the search query)
  const textAfterSlash = textUpToCursor.slice(lastSlashIndex + 1);

  // If there's a space after the command text, they've moved on
  // (ignore zero-width spaces as they may be adjacent to chips)
  if (
    /\s/.test(textAfterSlash.replace(new RegExp(CHIP_PLACEHOLDER, 'g'), ''))
  ) {
    return {
      shouldShowAutocomplete: false,
      searchQuery: '',
      slashIndex: -1,
    };
  }

  // Strip chip placeholders from search query
  const cleanSearchQuery = textAfterSlash.replace(
    new RegExp(CHIP_PLACEHOLDER, 'g'),
    ''
  );

  return {
    shouldShowAutocomplete: true,
    searchQuery: cleanSearchQuery,
    slashIndex: lastSlashIndex,
  };
}

/** XML tag name for user command markers */
export const COMMAND_TAG_NAME = 'user-command';
export const COMMAND_TAG_OPEN = '<user-command';
export const COMMAND_TAG_CLOSE = '</user-command>';

/**
 * Escapes special characters for XML attribute values.
 */
function escapeXmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Unescapes XML attribute values back to their original form.
 */
function unescapeXmlAttr(str: string): string {
  return str
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

/**
 * Wraps a chip's prompt with XML-style markers for later parsing.
 *
 * Format: <user-command key="..." name="..." description="...">prompt text</user-command>
 * (description attribute is omitted if empty)
 */
export function wrapChipPrompt(chip: SlashCommandChip): string {
  const desc = chip.description
    ? ` description="${escapeXmlAttr(chip.description)}"`
    : '';
  return `<user-command key="${escapeXmlAttr(chip.key)}" name="${escapeXmlAttr(chip.name)}"${desc}>${chip.prompt}</user-command>`;
}

/**
 * Expands slash command chips into the final message text.
 *
 * Takes the text content and embedded chips, and produces a final message
 * with chip prompts expanded and wrapped with markers for parsing.
 *
 * If chips have position information, they are inserted at their positions.
 * Otherwise, falls back to legacy behavior of prepending all prompts.
 *
 * @param text - The text content (may contain chip placeholder characters)
 * @param chips - Array of slash command chips to expand
 * @returns The expanded message with chip prompts wrapped in markers
 */
export function expandChipsInMessage(
  text: string,
  chips: SlashCommandChip[]
): string {
  // Clean text by removing chip placeholders
  const cleanText = text.replace(new RegExp(CHIP_PLACEHOLDER, 'g'), '').trim();

  if (chips.length === 0) {
    return cleanText;
  }

  // Check if any chip has position info
  const hasPositions = chips.some((chip) => chip.position !== undefined);

  if (!hasPositions) {
    // Legacy behavior: prepend all prompts (for backward compatibility)
    const chipPrompts = chips.map((chip) => wrapChipPrompt(chip)).join('\n\n');
    return cleanText ? `${chipPrompts}\n\n${cleanText}` : chipPrompts;
  }

  // Position-aware expansion: insert prompts at their positions
  // Sort chips by position DESCENDING to insert from end to start
  // (prevents position shifts during insertion)
  const sortedChips = [...chips].sort(
    (a, b) => (b.position ?? 0) - (a.position ?? 0)
  );

  let result = text;
  for (const chip of sortedChips) {
    const pos = chip.position ?? 0;
    // Bounds check
    if (pos < 0 || pos > result.length) continue;

    const wrappedPrompt = wrapChipPrompt(chip);
    // Replace placeholder character at position with wrapped prompt
    result = result.slice(0, pos) + wrappedPrompt + result.slice(pos + 1);
  }

  // Remove any remaining placeholders and trim
  return result.replace(new RegExp(CHIP_PLACEHOLDER, 'g'), '').trim();
}

/**
 * Represents a segment of parsed message content.
 */
export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'chip'; key: string; name: string; description?: string; prompt: string };

/**
 * Parses a message string and extracts chip markers into segments.
 *
 * Parses XML-style format: <user-command key="..." name="..." description="...">prompt</user-command>
 *
 * @param message - The message text potentially containing chip markers
 * @returns Array of segments (text and chip)
 */
export function parseMessageWithChips(message: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  // Match XML-style user-command tags
  // Captures: key, name, optional description, prompt content
  const regex =
    /<user-command\s+key="([^"]*)"\s+name="([^"]*)"(?:\s+description="([^"]*)")?\s*>([\s\S]*?)<\/user-command>/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(message)) !== null) {
    // Add text before this chip
    if (match.index > lastIndex) {
      const textContent = message.slice(lastIndex, match.index);
      if (textContent) {
        segments.push({ type: 'text', content: textContent });
      }
    }

    // Extract attributes (already escaped in the XML)
    const [, keyAttr, nameAttr, descAttr, prompt] = match;
    if (keyAttr !== undefined && nameAttr !== undefined && prompt !== undefined) {
      const key = unescapeXmlAttr(keyAttr);
      const name = unescapeXmlAttr(nameAttr);
      const description = descAttr ? unescapeXmlAttr(descAttr) : undefined;

      if (key && name) {
        segments.push({
          type: 'chip',
          key,
          name,
          description,
          prompt,
        });
      }
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text after last chip
  if (lastIndex < message.length) {
    const textContent = message.slice(lastIndex);
    if (textContent) {
      segments.push({ type: 'text', content: textContent });
    }
  }

  // If no segments found, return the whole message as text
  if (segments.length === 0 && message) {
    segments.push({ type: 'text', content: message });
  }

  return segments;
}

/**
 * Checks if a message contains chip markers.
 */
export function hasChipMarkers(message: string): boolean {
  return (
    message.includes(COMMAND_TAG_OPEN) && message.includes(COMMAND_TAG_CLOSE)
  );
}

/**
 * Strips chip markers from a message, leaving only the prompt text.
 * Use this when you want to display the message without chip formatting.
 *
 * @param message - The message text potentially containing chip markers
 * @returns The message with markers stripped, showing only prompts and text
 */
export function stripChipMarkers(message: string): string {
  // Match XML-style user-command tags and replace with just the prompt content
  const regex =
    /<user-command\s+key="[^"]*"\s+name="[^"]*"(?:\s+description="[^"]*")?\s*>([\s\S]*?)<\/user-command>/g;
  return message.replace(regex, '$1');
}

/**
 * Cleans text by removing chip placeholder characters.
 *
 * @param text - Text that may contain chip placeholders
 * @returns Clean text without placeholders
 */
export function cleanTextFromPlaceholders(text: string): string {
  return text.replace(new RegExp(CHIP_PLACEHOLDER, 'g'), '').trim();
}

/**
 * Checks if a message has any content (text or chips).
 *
 * @param text - The text content
 * @param chips - Array of chips
 * @returns True if there's content to submit
 */
export function hasMessageContent(
  text: string,
  chips: SlashCommandChip[]
): boolean {
  const cleanText = cleanTextFromPlaceholders(text);
  return cleanText.length > 0 || chips.length > 0;
}
