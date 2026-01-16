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
 * - There's a space after the slash command text
 * - The slash is removed
 *
 * @param inputValue - The current input value
 * @returns Context about the slash command detection
 */
export function detectSlashCommand(inputValue: string): SlashCommandContext {
  // Find the last "/" in the input
  const lastSlashIndex = inputValue.lastIndexOf('/');

  if (lastSlashIndex === -1) {
    return {
      shouldShowAutocomplete: false,
      searchQuery: '',
      slashIndex: -1,
    };
  }

  // Check if "/" is at start or after whitespace/chip placeholder
  const charBefore = inputValue[lastSlashIndex - 1];
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

  // Get the text after the slash (the search query)
  const textAfterSlash = inputValue.slice(lastSlashIndex + 1);

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

/** Marker format for chip prompts in messages */
export const CHIP_MARKER_START = '««CHIP:';
export const CHIP_MARKER_SEPARATOR = ':';
export const CHIP_MARKER_END_TAG = '»»';
export const CHIP_MARKER_CLOSE = '««/CHIP»»';

/**
 * Wraps a chip's prompt with markers for later parsing.
 *
 * Format: ««CHIP:key:name»»prompt text««/CHIP»»
 */
export function wrapChipPrompt(chip: SlashCommandChip): string {
  return `${CHIP_MARKER_START}${chip.key}${CHIP_MARKER_SEPARATOR}${chip.name}${CHIP_MARKER_END_TAG}${chip.prompt}${CHIP_MARKER_CLOSE}`;
}

/**
 * Expands slash command chips into the final message text.
 *
 * Takes the text content and embedded chips, and produces a final message
 * with chip prompts expanded and wrapped with markers for parsing.
 *
 * @param text - The text content (may contain chip placeholder characters)
 * @param chips - Array of slash command chips to expand
 * @returns The expanded message with chip prompts wrapped in markers
 */
export function expandChipsInMessage(
  text: string,
  chips: SlashCommandChip[]
): string {
  // Clean the text by removing chip placeholders
  const cleanText = text.replace(new RegExp(CHIP_PLACEHOLDER, 'g'), '').trim();

  if (chips.length === 0) {
    return cleanText;
  }

  // Collect all chip prompts wrapped with markers
  const chipPrompts = chips.map((chip) => wrapChipPrompt(chip)).join('\n\n');

  // Combine chip prompts with any additional text
  return cleanText ? `${chipPrompts}\n\n${cleanText}` : chipPrompts;
}

/**
 * Represents a segment of parsed message content.
 */
export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'chip'; key: string; name: string; prompt: string };

/**
 * Parses a message string and extracts chip markers into segments.
 *
 * @param message - The message text potentially containing chip markers
 * @returns Array of segments (text and chip)
 */
export function parseMessageWithChips(message: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  const regex = new RegExp(
    `${escapeRegex(CHIP_MARKER_START)}([^:]+)${escapeRegex(CHIP_MARKER_SEPARATOR)}([^»]+)${escapeRegex(CHIP_MARKER_END_TAG)}([\\s\\S]*?)${escapeRegex(CHIP_MARKER_CLOSE)}`,
    'g'
  );

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

    // Add the chip
    const [, key, name, prompt] = match;
    if (key && name && prompt !== undefined) {
      segments.push({
        type: 'chip',
        key,
        name,
        prompt,
      });
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
    message.includes(CHIP_MARKER_START) && message.includes(CHIP_MARKER_CLOSE)
  );
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Strips chip markers from a message, leaving only the prompt text.
 * Use this when you want to display the message without chip formatting.
 *
 * @param message - The message text potentially containing chip markers
 * @returns The message with markers stripped, showing only prompts and text
 */
export function stripChipMarkers(message: string): string {
  const regex = new RegExp(
    `${escapeRegex(CHIP_MARKER_START)}[^:]+${escapeRegex(CHIP_MARKER_SEPARATOR)}[^»]+${escapeRegex(CHIP_MARKER_END_TAG)}([\\s\\S]*?)${escapeRegex(CHIP_MARKER_CLOSE)}`,
    'g'
  );
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
