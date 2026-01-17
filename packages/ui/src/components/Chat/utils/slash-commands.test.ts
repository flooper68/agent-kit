import { describe, it, expect } from 'vitest';
import {
  detectSlashCommand,
  expandChipsInMessage,
  cleanTextFromPlaceholders,
  hasMessageContent,
  wrapChipPrompt,
  parseMessageWithChips,
  hasChipMarkers,
  stripChipMarkers,
  CHIP_PLACEHOLDER,
  COMMAND_TAG_OPEN,
  COMMAND_TAG_CLOSE,
} from './slash-commands';
import type { SlashCommandChip } from '../Core/RichTextInput';

describe('detectSlashCommand', () => {
  describe('when no slash is present', () => {
    it('returns shouldShowAutocomplete: false', () => {
      const result = detectSlashCommand('hello world');
      expect(result.shouldShowAutocomplete).toBe(false);
      expect(result.searchQuery).toBe('');
      expect(result.slashIndex).toBe(-1);
    });

    it('handles empty input', () => {
      const result = detectSlashCommand('');
      expect(result.shouldShowAutocomplete).toBe(false);
    });
  });

  describe('when slash is at the start', () => {
    it('detects slash at beginning of input', () => {
      const result = detectSlashCommand('/sum');
      expect(result.shouldShowAutocomplete).toBe(true);
      expect(result.searchQuery).toBe('sum');
      expect(result.slashIndex).toBe(0);
    });

    it('detects just a slash', () => {
      const result = detectSlashCommand('/');
      expect(result.shouldShowAutocomplete).toBe(true);
      expect(result.searchQuery).toBe('');
      expect(result.slashIndex).toBe(0);
    });
  });

  describe('when slash is after whitespace', () => {
    it('detects slash after space', () => {
      const result = detectSlashCommand('hello /sum');
      expect(result.shouldShowAutocomplete).toBe(true);
      expect(result.searchQuery).toBe('sum');
      expect(result.slashIndex).toBe(6);
    });

    it('detects slash after newline', () => {
      const result = detectSlashCommand('hello\n/sum');
      expect(result.shouldShowAutocomplete).toBe(true);
      expect(result.searchQuery).toBe('sum');
      expect(result.slashIndex).toBe(6);
    });

    it('detects slash after tab', () => {
      const result = detectSlashCommand('hello\t/sum');
      expect(result.shouldShowAutocomplete).toBe(true);
      expect(result.searchQuery).toBe('sum');
      expect(result.slashIndex).toBe(6);
    });
  });

  describe('when slash is after chip placeholder', () => {
    it('detects slash after chip placeholder', () => {
      const result = detectSlashCommand(`text${CHIP_PLACEHOLDER}/sum`);
      expect(result.shouldShowAutocomplete).toBe(true);
      expect(result.searchQuery).toBe('sum');
    });
  });

  describe('when slash is in invalid position', () => {
    it('does not detect slash in middle of word', () => {
      const result = detectSlashCommand('hel/lo');
      expect(result.shouldShowAutocomplete).toBe(false);
    });

    it('does not detect slash immediately after non-whitespace', () => {
      const result = detectSlashCommand('hello/sum');
      expect(result.shouldShowAutocomplete).toBe(false);
    });
  });

  describe('when space appears after command text', () => {
    it('ends detection when space appears after command', () => {
      const result = detectSlashCommand('/sum ');
      expect(result.shouldShowAutocomplete).toBe(false);
    });

    it('ends detection with trailing text', () => {
      const result = detectSlashCommand('/sum marize this');
      expect(result.shouldShowAutocomplete).toBe(false);
    });
  });

  describe('with multiple slashes', () => {
    it('uses the last slash', () => {
      const result = detectSlashCommand('/first /second');
      expect(result.shouldShowAutocomplete).toBe(true);
      expect(result.searchQuery).toBe('second');
      expect(result.slashIndex).toBe(7);
    });
  });

  describe('with cursor position parameter', () => {
    it('detects slash when cursor is at end (default behavior)', () => {
      const result = detectSlashCommand('/sum');
      expect(result.shouldShowAutocomplete).toBe(true);
      expect(result.searchQuery).toBe('sum');
    });

    it('detects slash when cursor is at end of command', () => {
      // User typed "hello /sum world" with cursor after "sum" (position 10)
      const result = detectSlashCommand('hello /sum world', 10);
      expect(result.shouldShowAutocomplete).toBe(true);
      expect(result.searchQuery).toBe('sum');
      expect(result.slashIndex).toBe(6);
    });

    it('does not detect slash when cursor is at end with space after command', () => {
      // User typed "hello /sum world" with cursor at end (position 16)
      const result = detectSlashCommand('hello /sum world', 16);
      expect(result.shouldShowAutocomplete).toBe(false);
    });

    it('detects partial command with cursor in middle', () => {
      // User typed "hello /su world" with cursor after "su" (position 9)
      const result = detectSlashCommand('hello /su world', 9);
      expect(result.shouldShowAutocomplete).toBe(true);
      expect(result.searchQuery).toBe('su');
      expect(result.slashIndex).toBe(6);
    });

    it('detects just slash with cursor after it', () => {
      // User typed "text / more" with cursor right after slash (position 6)
      const result = detectSlashCommand('text / more', 6);
      expect(result.shouldShowAutocomplete).toBe(true);
      expect(result.searchQuery).toBe('');
      expect(result.slashIndex).toBe(5);
    });

    it('works with cursor at position 0', () => {
      const result = detectSlashCommand('/sum', 0);
      expect(result.shouldShowAutocomplete).toBe(false);
    });

    it('works with cursor at position 1 (just after slash)', () => {
      const result = detectSlashCommand('/sum', 1);
      expect(result.shouldShowAutocomplete).toBe(true);
      expect(result.searchQuery).toBe('');
      expect(result.slashIndex).toBe(0);
    });

    it('finds slash before cursor, not after', () => {
      // User typed "/first /second" with cursor at position 7 (after "/first ")
      // Should NOT detect "/second" because cursor is before it
      const result = detectSlashCommand('/first /second', 7);
      expect(result.shouldShowAutocomplete).toBe(false); // Space after /first means detection ends
    });

    it('detects slash in middle of input with cursor right after command', () => {
      // User typed "start /cmd end" with cursor at position 10 (after "cmd")
      const result = detectSlashCommand('start /cmd end', 10);
      expect(result.shouldShowAutocomplete).toBe(true);
      expect(result.searchQuery).toBe('cmd');
      expect(result.slashIndex).toBe(6);
    });

    it('maintains backward compatibility when cursor position is undefined', () => {
      // Without cursor position, should analyze entire string (original behavior)
      const result = detectSlashCommand('hello /sum');
      expect(result.shouldShowAutocomplete).toBe(true);
      expect(result.searchQuery).toBe('sum');
    });
  });
});

describe('expandChipsInMessage', () => {
  const createChip = (
    id: string,
    key: string,
    prompt: string
  ): SlashCommandChip => ({
    id,
    key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    prompt,
  });

  describe('with no chips', () => {
    it('returns cleaned text', () => {
      const result = expandChipsInMessage('hello world', []);
      expect(result).toBe('hello world');
    });

    it('removes chip placeholders', () => {
      const result = expandChipsInMessage(`hello${CHIP_PLACEHOLDER}world`, []);
      expect(result).toBe('helloworld');
    });

    it('trims whitespace', () => {
      const result = expandChipsInMessage('  hello world  ', []);
      expect(result).toBe('hello world');
    });

    it('handles empty text', () => {
      const result = expandChipsInMessage('', []);
      expect(result).toBe('');
    });
  });

  describe('with one chip', () => {
    it('expands chip prompt wrapped with markers and additional text', () => {
      const chips = [createChip('1', 'summarize', 'Please summarize:')];
      const result = expandChipsInMessage('this document', chips);
      // The chip is wrapped with XML-style markers
      expect(result).toContain(COMMAND_TAG_OPEN);
      expect(result).toContain(COMMAND_TAG_CLOSE);
      expect(result).toContain('Please summarize:');
      expect(result).toContain('this document');
    });

    it('expands chip prompt alone when no additional text', () => {
      const chips = [createChip('1', 'summarize', 'Please summarize:')];
      const result = expandChipsInMessage('', chips);
      expect(result).toContain('Please summarize:');
      expect(result).toContain(COMMAND_TAG_OPEN);
      expect(result).toContain(COMMAND_TAG_CLOSE);
    });

    it('expands chip prompt with only placeholder text', () => {
      const chips = [createChip('1', 'summarize', 'Please summarize:')];
      const result = expandChipsInMessage(CHIP_PLACEHOLDER, chips);
      expect(result).toContain('Please summarize:');
      expect(result).not.toContain(CHIP_PLACEHOLDER);
    });

    it('removes placeholders from text when expanding', () => {
      const chips = [createChip('1', 'summarize', 'Please summarize:')];
      const result = expandChipsInMessage(
        `${CHIP_PLACEHOLDER}this document`,
        chips
      );
      expect(result).toContain('this document');
      expect(result).not.toContain(CHIP_PLACEHOLDER);
    });
  });

  describe('with multiple chips', () => {
    it('expands all chip prompts in order', () => {
      const chips = [
        createChip('1', 'summarize', 'Please summarize:'),
        createChip('2', 'translate', 'Then translate to Spanish:'),
      ];
      const result = expandChipsInMessage('this document', chips);
      expect(result).toContain('Please summarize:');
      expect(result).toContain('Then translate to Spanish:');
      expect(result).toContain('this document');
      // Both chips should have markers
      expect(result.split(COMMAND_TAG_OPEN).length - 1).toBe(2);
      expect(result.split(COMMAND_TAG_CLOSE).length - 1).toBe(2);
    });

    it('expands multiple chips without additional text', () => {
      const chips = [
        createChip('1', 'summarize', 'Please summarize:'),
        createChip('2', 'translate', 'Then translate to Spanish:'),
      ];
      const result = expandChipsInMessage('', chips);
      expect(result).toContain('Please summarize:');
      expect(result).toContain('Then translate to Spanish:');
    });
  });

  describe('roundtrip with stripChipMarkers', () => {
    it('can strip markers to get original content', () => {
      const chips = [createChip('1', 'summarize', 'Please summarize:')];
      const expanded = expandChipsInMessage('this document', chips);
      const stripped = stripChipMarkers(expanded);
      expect(stripped).toBe('Please summarize:\n\nthis document');
    });
  });

  describe('with chip positions', () => {
    const createChipWithPosition = (
      id: string,
      key: string,
      prompt: string,
      position: number
    ): SlashCommandChip => ({
      id,
      key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      prompt,
      position,
    });

    it('inserts prompt at chip position in middle of text', () => {
      const chips = [
        createChipWithPosition('1', 'summarize', 'Please summarize:', 6),
      ];
      const text = `Hello ${CHIP_PLACEHOLDER}world`;
      const result = expandChipsInMessage(text, chips);
      expect(result).toBe(
        'Hello <user-command key="summarize" name="Summarize">Please summarize:</user-command>world'
      );
    });

    it('inserts prompt at start when position is 0', () => {
      const chips = [
        createChipWithPosition('1', 'summarize', 'Please summarize:', 0),
      ];
      const text = `${CHIP_PLACEHOLDER}Hello world`;
      const result = expandChipsInMessage(text, chips);
      expect(result.startsWith('<user-command')).toBe(true);
      expect(result).toContain('Hello world');
    });

    it('inserts prompt at end when position is at end', () => {
      const chips = [
        createChipWithPosition('1', 'summarize', 'Please summarize:', 12),
      ];
      const text = `Hello world ${CHIP_PLACEHOLDER}`;
      const result = expandChipsInMessage(text, chips);
      expect(result).toContain('Hello world');
      expect(result.endsWith('</user-command>')).toBe(true);
    });

    it('inserts multiple prompts at their respective positions', () => {
      const chips = [
        createChipWithPosition('1', 'a', 'prompt-a', 6),
        createChipWithPosition('2', 'b', 'prompt-b', 14),
      ];
      const text = `Hello ${CHIP_PLACEHOLDER}world ${CHIP_PLACEHOLDER}end`;
      const result = expandChipsInMessage(text, chips);
      const aIndex = result.indexOf('prompt-a');
      const bIndex = result.indexOf('prompt-b');
      const helloIndex = result.indexOf('Hello');
      const worldIndex = result.indexOf('world');
      expect(helloIndex).toBeLessThan(aIndex);
      expect(aIndex).toBeLessThan(worldIndex);
      expect(worldIndex).toBeLessThan(bIndex);
    });

    it('handles out of bounds position gracefully', () => {
      const chips = [createChipWithPosition('1', 'test', 'test prompt', 1000)];
      const text = `Hello${CHIP_PLACEHOLDER}`;
      const result = expandChipsInMessage(text, chips);
      expect(result).toBe('Hello'); // Chip skipped due to invalid position
    });

    it('handles chip positions correctly when text has leading newlines', () => {
      // Simulates what happens when parseContent returns trimmed text
      // but positions were calculated on untrimmed text, then adjusted
      const chips = [
        createChipWithPosition('1', 'test', 'test prompt', 0), // After adjustment
      ];
      const text = `${CHIP_PLACEHOLDER}Hello world`; // Trimmed text
      const result = expandChipsInMessage(text, chips);
      expect(result).toContain('test prompt');
      expect(result).toContain('Hello world');
    });
  });
});

describe('cleanTextFromPlaceholders', () => {
  it('removes chip placeholders', () => {
    const result = cleanTextFromPlaceholders(`hello${CHIP_PLACEHOLDER}world`);
    expect(result).toBe('helloworld');
  });

  it('removes multiple placeholders', () => {
    const result = cleanTextFromPlaceholders(
      `${CHIP_PLACEHOLDER}hello${CHIP_PLACEHOLDER}world${CHIP_PLACEHOLDER}`
    );
    expect(result).toBe('helloworld');
  });

  it('trims whitespace', () => {
    const result = cleanTextFromPlaceholders('  hello  ');
    expect(result).toBe('hello');
  });

  it('handles empty string', () => {
    const result = cleanTextFromPlaceholders('');
    expect(result).toBe('');
  });

  it('handles string with only placeholders', () => {
    const result = cleanTextFromPlaceholders(
      `${CHIP_PLACEHOLDER}${CHIP_PLACEHOLDER}`
    );
    expect(result).toBe('');
  });
});

describe('hasMessageContent', () => {
  it('returns true for text with content', () => {
    expect(hasMessageContent('hello', [])).toBe(true);
  });

  it('returns true for chips without text', () => {
    const chips = [
      { id: '1', key: 'sum', name: 'Summarize', prompt: 'Summarize:' },
    ];
    expect(hasMessageContent('', chips)).toBe(true);
  });

  it('returns true for both text and chips', () => {
    const chips = [
      { id: '1', key: 'sum', name: 'Summarize', prompt: 'Summarize:' },
    ];
    expect(hasMessageContent('hello', chips)).toBe(true);
  });

  it('returns false for empty text and no chips', () => {
    expect(hasMessageContent('', [])).toBe(false);
  });

  it('returns false for whitespace-only text and no chips', () => {
    expect(hasMessageContent('   ', [])).toBe(false);
  });

  it('returns false for placeholder-only text and no chips', () => {
    expect(hasMessageContent(CHIP_PLACEHOLDER, [])).toBe(false);
  });
});

// ============================================================================
// Chip Marker Tests
// ============================================================================

describe('wrapChipPrompt', () => {
  const createChip = (
    key: string,
    name: string,
    prompt: string,
    description?: string
  ): SlashCommandChip => ({
    id: '1',
    key,
    name,
    prompt,
    description,
  });

  it('wraps chip prompt with XML-style markers', () => {
    const chip = createChip('summarize', 'Summarize', 'Please summarize:');
    const result = wrapChipPrompt(chip);
    expect(result).toBe(
      '<user-command key="summarize" name="Summarize">Please summarize:</user-command>'
    );
  });

  it('includes description attribute when present', () => {
    const chip = createChip(
      'code-review',
      'Code Review',
      'Review this code:',
      'Performs code review'
    );
    const result = wrapChipPrompt(chip);
    expect(result).toBe(
      '<user-command key="code-review" name="Code Review" description="Performs code review">Review this code:</user-command>'
    );
  });

  it('handles empty prompt', () => {
    const chip = createChip('quick', 'Quick', '');
    const result = wrapChipPrompt(chip);
    expect(result).toBe(
      '<user-command key="quick" name="Quick"></user-command>'
    );
  });

  it('handles multi-line prompt', () => {
    const chip = createChip(
      'explain',
      'Explain',
      'Please explain:\n- Point 1\n- Point 2'
    );
    const result = wrapChipPrompt(chip);
    expect(result).toContain('Please explain:\n- Point 1\n- Point 2');
    expect(result).toContain(COMMAND_TAG_OPEN);
    expect(result).toContain(COMMAND_TAG_CLOSE);
  });

  it('escapes special characters in key and name', () => {
    const chip = createChip('test&key', 'Test "Name"', 'prompt');
    const result = wrapChipPrompt(chip);
    expect(result).toBe(
      '<user-command key="test&amp;key" name="Test &quot;Name&quot;">prompt</user-command>'
    );
  });

  it('escapes special characters in description', () => {
    const chip = createChip(
      'test',
      'Test',
      'prompt',
      'Has <special> chars & "quotes"'
    );
    const result = wrapChipPrompt(chip);
    expect(result).toBe(
      '<user-command key="test" name="Test" description="Has &lt;special&gt; chars &amp; &quot;quotes&quot;">prompt</user-command>'
    );
  });
});

describe('hasChipMarkers', () => {
  it('returns true for message with chip markers', () => {
    const message =
      '<user-command key="summarize" name="Summarize">Please summarize:</user-command>';
    expect(hasChipMarkers(message)).toBe(true);
  });

  it('returns false for plain text', () => {
    expect(hasChipMarkers('Hello world')).toBe(false);
  });

  it('returns false for partial markers (start only)', () => {
    expect(hasChipMarkers('<user-command key="test" name="Test">')).toBe(false);
  });

  it('returns false for partial markers (end only)', () => {
    expect(hasChipMarkers('Some text </user-command>')).toBe(false);
  });

  it('returns true for multiple chip markers', () => {
    const message =
      '<user-command key="a" name="A">prompt1</user-command> text <user-command key="b" name="B">prompt2</user-command>';
    expect(hasChipMarkers(message)).toBe(true);
  });
});

describe('parseMessageWithChips', () => {
  it('returns single text segment for plain text', () => {
    const result = parseMessageWithChips('Hello world');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: 'text', content: 'Hello world' });
  });

  it('returns empty array for empty string', () => {
    const result = parseMessageWithChips('');
    expect(result).toHaveLength(0);
  });

  it('parses single chip marker', () => {
    const message =
      '<user-command key="summarize" name="Summarize">Please summarize:</user-command>';
    const result = parseMessageWithChips(message);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'chip',
      key: 'summarize',
      name: 'Summarize',
      prompt: 'Please summarize:',
    });
  });

  it('parses chip with description attribute', () => {
    const message =
      '<user-command key="review" name="Code Review" description="Reviews code quality">Review this:</user-command>';
    const result = parseMessageWithChips(message);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'chip',
      key: 'review',
      name: 'Code Review',
      description: 'Reviews code quality',
      prompt: 'Review this:',
    });
  });

  it('parses chip with text after', () => {
    const message =
      '<user-command key="summarize" name="Summarize">Please summarize:</user-command>\n\nThis is the content.';
    const result = parseMessageWithChips(message);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      type: 'chip',
      key: 'summarize',
      name: 'Summarize',
      prompt: 'Please summarize:',
    });
    expect(result[1]).toEqual({
      type: 'text',
      content: '\n\nThis is the content.',
    });
  });

  it('parses text before chip', () => {
    const message =
      'Hello <user-command key="summarize" name="Summarize">Please summarize:</user-command>';
    const result = parseMessageWithChips(message);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'text', content: 'Hello ' });
    expect(result[1]).toEqual({
      type: 'chip',
      key: 'summarize',
      name: 'Summarize',
      prompt: 'Please summarize:',
    });
  });

  it('parses multiple chips', () => {
    const message =
      '<user-command key="summarize" name="Summarize">Summarize:</user-command>\n\n<user-command key="translate" name="Translate">Translate:</user-command>';
    const result = parseMessageWithChips(message);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      type: 'chip',
      key: 'summarize',
      name: 'Summarize',
      prompt: 'Summarize:',
    });
    expect(result[1]).toEqual({ type: 'text', content: '\n\n' });
    expect(result[2]).toEqual({
      type: 'chip',
      key: 'translate',
      name: 'Translate',
      prompt: 'Translate:',
    });
  });

  it('parses chips with text between and after', () => {
    const message =
      '<user-command key="a" name="A">prompt1</user-command> middle text <user-command key="b" name="B">prompt2</user-command> end text';
    const result = parseMessageWithChips(message);
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({
      type: 'chip',
      key: 'a',
      name: 'A',
      prompt: 'prompt1',
    });
    expect(result[1]).toEqual({ type: 'text', content: ' middle text ' });
    expect(result[2]).toEqual({
      type: 'chip',
      key: 'b',
      name: 'B',
      prompt: 'prompt2',
    });
    expect(result[3]).toEqual({ type: 'text', content: ' end text' });
  });

  it('handles chip with empty prompt', () => {
    const message = '<user-command key="quick" name="Quick"></user-command>';
    const result = parseMessageWithChips(message);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'chip',
      key: 'quick',
      name: 'Quick',
      prompt: '',
    });
  });

  it('handles chip with multi-line prompt', () => {
    const message =
      '<user-command key="explain" name="Explain">Please explain:\n- Point 1\n- Point 2</user-command>';
    const result = parseMessageWithChips(message);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'chip',
      key: 'explain',
      name: 'Explain',
      prompt: 'Please explain:\n- Point 1\n- Point 2',
    });
  });

  it('handles complex message with markdown', () => {
    const message = `<user-command key="summarize" name="Summarize">Please summarize:</user-command>

## Content

Here is **bold** and _italic_ text.

\`\`\`javascript
const x = 1;
\`\`\``;
    const result = parseMessageWithChips(message);
    expect(result).toHaveLength(2);
    expect(result[0]?.type).toBe('chip');
    expect(result[1]?.type).toBe('text');
    expect(result[1]?.type === 'text' && result[1].content).toContain(
      '## Content'
    );
    expect(result[1]?.type === 'text' && result[1].content).toContain(
      '```javascript'
    );
  });

  it('unescapes XML entities in attributes', () => {
    const message =
      '<user-command key="test&amp;key" name="Test &quot;Name&quot;" description="Has &lt;special&gt; chars">prompt</user-command>';
    const result = parseMessageWithChips(message);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'chip',
      key: 'test&key',
      name: 'Test "Name"',
      description: 'Has <special> chars',
      prompt: 'prompt',
    });
  });
});

describe('roundtrip: wrapChipPrompt and parseMessageWithChips', () => {
  const createChip = (
    key: string,
    name: string,
    prompt: string,
    description?: string
  ): SlashCommandChip => ({
    id: '1',
    key,
    name,
    prompt,
    description,
  });

  it('can roundtrip a single chip', () => {
    const chip = createChip(
      'summarize',
      'Summarize',
      'Please summarize the following:'
    );
    const wrapped = wrapChipPrompt(chip);
    const parsed = parseMessageWithChips(wrapped);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual({
      type: 'chip',
      key: chip.key,
      name: chip.name,
      prompt: chip.prompt,
    });
  });

  it('can roundtrip a chip with description', () => {
    const chip = createChip(
      'code-review',
      'Code Review',
      'Review this code:',
      'Performs code review'
    );
    const wrapped = wrapChipPrompt(chip);
    const parsed = parseMessageWithChips(wrapped);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual({
      type: 'chip',
      key: chip.key,
      name: chip.name,
      description: chip.description,
      prompt: chip.prompt,
    });
  });

  it('can roundtrip multiple chips with text', () => {
    const chip1 = createChip('summarize', 'Summarize', 'Summarize:');
    const chip2 = createChip('translate', 'Translate', 'Translate to Spanish:');
    const wrapped = `${wrapChipPrompt(chip1)}\n\n${wrapChipPrompt(chip2)}\n\nThe content to process.`;
    const parsed = parseMessageWithChips(wrapped);

    expect(parsed).toHaveLength(4);
    expect(parsed[0]).toEqual({
      type: 'chip',
      key: 'summarize',
      name: 'Summarize',
      prompt: 'Summarize:',
    });
    expect(parsed[1]).toEqual({ type: 'text', content: '\n\n' });
    expect(parsed[2]).toEqual({
      type: 'chip',
      key: 'translate',
      name: 'Translate',
      prompt: 'Translate to Spanish:',
    });
    expect(parsed[3]).toEqual({
      type: 'text',
      content: '\n\nThe content to process.',
    });
  });

  it('can roundtrip chip with special characters in attributes', () => {
    const chip = createChip(
      'test&key',
      'Test "Name"',
      'prompt',
      'Has <special> chars'
    );
    const wrapped = wrapChipPrompt(chip);
    const parsed = parseMessageWithChips(wrapped);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual({
      type: 'chip',
      key: chip.key,
      name: chip.name,
      description: chip.description,
      prompt: chip.prompt,
    });
  });
});

describe('stripChipMarkers', () => {
  it('returns plain text unchanged', () => {
    const result = stripChipMarkers('Hello world');
    expect(result).toBe('Hello world');
  });

  it('strips markers and keeps prompt', () => {
    const message =
      '<user-command key="summarize" name="Summarize">Please summarize:</user-command>';
    const result = stripChipMarkers(message);
    expect(result).toBe('Please summarize:');
  });

  it('strips markers from complex message', () => {
    const message =
      '<user-command key="summarize" name="Summarize">Please summarize:</user-command>\n\nThe content here.';
    const result = stripChipMarkers(message);
    expect(result).toBe('Please summarize:\n\nThe content here.');
  });

  it('strips multiple markers', () => {
    const message =
      '<user-command key="a" name="A">prompt1</user-command> text <user-command key="b" name="B">prompt2</user-command>';
    const result = stripChipMarkers(message);
    expect(result).toBe('prompt1 text prompt2');
  });

  it('handles empty prompt', () => {
    const message =
      '<user-command key="quick" name="Quick"></user-command> do this';
    const result = stripChipMarkers(message);
    expect(result).toBe(' do this');
  });

  it('handles markers with text before and after', () => {
    const message =
      'Before <user-command key="test" name="Test">the prompt</user-command> after';
    const result = stripChipMarkers(message);
    expect(result).toBe('Before the prompt after');
  });

  it('preserves newlines in prompts', () => {
    const message =
      '<user-command key="explain" name="Explain">Line 1\nLine 2\nLine 3</user-command>';
    const result = stripChipMarkers(message);
    expect(result).toBe('Line 1\nLine 2\nLine 3');
  });

  it('strips markers with description attribute', () => {
    const message =
      '<user-command key="review" name="Review" description="Code review">Review this code:</user-command>';
    const result = stripChipMarkers(message);
    expect(result).toBe('Review this code:');
  });
});
