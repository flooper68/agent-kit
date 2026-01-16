import {
  forwardRef,
  memo,
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
} from 'react';
import { cn } from '../../../../lib/utils';

export interface SlashCommandChip {
  id: string;
  key: string;
  name: string;
  prompt: string;
}

export interface RichTextInputProps {
  /** Plain text value (text only, without chips) */
  value: string;
  /** Embedded command chips */
  chips: SlashCommandChip[];
  /** Called when text or chips change */
  onChange: (value: string, chips: SlashCommandChip[]) => void;
  /** Called when form should be submitted */
  onSubmit: (text: string, chips: SlashCommandChip[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Max height for auto-resize */
  maxHeight?: number;
}

export interface RichTextInputRef {
  focus: () => void;
  insertChip: (chip: SlashCommandChip) => void;
  /** Insert chip replacing the slash command text (deletes chars before cursor) */
  insertChipReplacingText: (chip: SlashCommandChip, charsToDelete: number) => void;
  getElement: () => HTMLDivElement | null;
}

// Data attribute used to identify chip elements
const CHIP_DATA_ATTR = 'data-chip-id';

/**
 * RichTextInput - A contenteditable input that supports inline chips.
 *
 * Renders as a contenteditable div that can contain both text and
 * non-editable chip elements representing slash commands.
 */
export const RichTextInput = memo(
  forwardRef<RichTextInputRef, RichTextInputProps>(
    (
      {
        value: _value,
        chips,
        onChange,
        onSubmit,
        placeholder = '',
        disabled = false,
        className,
        autoFocus = false,
        maxHeight = 200,
      },
      ref
    ) => {
      const editorRef = useRef<HTMLDivElement>(null);
      const isComposingRef = useRef(false);
      const lastChipsRef = useRef<SlashCommandChip[]>([]);
      // Store inserted chips so parseContent can find them before they're in props
      const insertedChipsRef = useRef<Map<string, SlashCommandChip>>(new Map());

      // Parse the contenteditable DOM to extract text and chips
      const parseContent = useCallback((): {
        text: string;
        chips: SlashCommandChip[];
        chipPositions: Map<string, number>;
      } => {
        const editor = editorRef.current;
        if (!editor) return { text: '', chips: [], chipPositions: new Map() };

        let text = '';
        const foundChips: SlashCommandChip[] = [];
        const chipPositions = new Map<string, number>();

        const processNode = (node: Node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent ?? '';
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const chipId = element.getAttribute(CHIP_DATA_ATTR);

            if (chipId) {
              // This is a chip - record its position
              chipPositions.set(chipId, text.length);
              // Find the chip data from our chips array or inserted chips ref
              const chip =
                chips.find((c) => c.id === chipId) ??
                insertedChipsRef.current.get(chipId);
              if (chip) {
                foundChips.push(chip);
              }
              // Add a placeholder character for the chip position
              text += '\u200B'; // Zero-width space as placeholder
            } else if (element.tagName === 'BR') {
              text += '\n';
            } else if (element.tagName === 'DIV' && text.length > 0 && !text.endsWith('\n')) {
              // Div elements in contenteditable typically represent new lines
              text += '\n';
              element.childNodes.forEach(processNode);
            } else {
              element.childNodes.forEach(processNode);
            }
          }
        };

        editor.childNodes.forEach(processNode);

        return { text: text.trim(), chips: foundChips, chipPositions };
      }, [chips]);

      // Handle input changes - defined first so other callbacks can use it
      const handleInput = useCallback(() => {
        if (isComposingRef.current) return;

        const { text, chips: foundChips } = parseContent();
        onChange(text, foundChips);
      }, [onChange, parseContent]);

      // Create a chip element
      const createChipElement = useCallback(
        (chip: SlashCommandChip): HTMLSpanElement => {
          const chipEl = document.createElement('span');
          chipEl.setAttribute(CHIP_DATA_ATTR, chip.id);
          chipEl.setAttribute('contenteditable', 'false');
          chipEl.className =
            'inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded bg-primary/10 text-primary text-sm align-baseline select-none';

          const keySpan = document.createElement('span');
          keySpan.className = 'font-mono text-xs';
          keySpan.textContent = `/${chip.key}`;

          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'hover:bg-primary/20 rounded-full p-0.5 ml-0.5';
          removeBtn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
          removeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Clean up from inserted chips ref
            insertedChipsRef.current.delete(chip.id);
            chipEl.remove();
            handleInput();
          };

          chipEl.appendChild(keySpan);
          chipEl.appendChild(removeBtn);

          return chipEl;
        },
        [handleInput]
      );

      // Insert a chip at the current cursor position
      const insertChip = useCallback(
        (chip: SlashCommandChip) => {
          const editor = editorRef.current;
          if (!editor) return;

          // Store chip data so parseContent can find it
          insertedChipsRef.current.set(chip.id, chip);

          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) {
            // No selection, append to end
            editor.appendChild(createChipElement(chip));
            editor.appendChild(document.createTextNode('\u00A0')); // Add space after chip
          } else {
            const range = selection.getRangeAt(0);

            // Check if we're inside the editor
            if (!editor.contains(range.commonAncestorContainer)) {
              editor.appendChild(createChipElement(chip));
              editor.appendChild(document.createTextNode('\u00A0'));
            } else {
              // Insert at cursor position
              range.deleteContents();
              const chipEl = createChipElement(chip);
              range.insertNode(chipEl);

              // Move cursor after chip
              const spaceNode = document.createTextNode('\u00A0');
              chipEl.after(spaceNode);
              range.setStartAfter(spaceNode);
              range.setEndAfter(spaceNode);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }

          editor.focus();
          handleInput();
        },
        [createChipElement, handleInput]
      );

      // Insert a chip, replacing text before the cursor (for slash command replacement)
      const insertChipReplacingText = useCallback(
        (chip: SlashCommandChip, charsToDelete: number) => {
          const editor = editorRef.current;
          if (!editor) return;

          // Store chip data so parseContent can find it
          insertedChipsRef.current.set(chip.id, chip);

          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) {
            // No selection, just insert at end
            editor.appendChild(createChipElement(chip));
            editor.appendChild(document.createTextNode('\u00A0'));
            editor.focus();
            handleInput();
            return;
          }

          const range = selection.getRangeAt(0);

          // Check if we're inside the editor
          if (!editor.contains(range.commonAncestorContainer)) {
            editor.appendChild(createChipElement(chip));
            editor.appendChild(document.createTextNode('\u00A0'));
            editor.focus();
            handleInput();
            return;
          }

          // Use Selection API to extend selection backwards and delete
          if (charsToDelete > 0) {
            // Extend selection backwards by charsToDelete characters
            for (let i = 0; i < charsToDelete; i++) {
              selection.modify('extend', 'backward', 'character');
            }
            // Delete the selected text
            selection.deleteFromDocument();
          }

          // Get fresh range after deletion
          const newRange = selection.getRangeAt(0);

          // Insert the chip at the current cursor position
          const chipEl = createChipElement(chip);
          newRange.insertNode(chipEl);

          // Move cursor after chip with a space
          const spaceNode = document.createTextNode('\u00A0');
          chipEl.after(spaceNode);

          // Set cursor after the space
          const finalRange = document.createRange();
          finalRange.setStartAfter(spaceNode);
          finalRange.setEndAfter(spaceNode);
          selection.removeAllRanges();
          selection.addRange(finalRange);

          editor.focus();
          handleInput();
        },
        [createChipElement, handleInput]
      );

      // Handle keydown for Enter/Shift+Enter and Backspace
      const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const { text, chips: foundChips } = parseContent();
            if (text.trim() || foundChips.length > 0) {
              onSubmit(text, foundChips);
            }
          } else if (e.key === 'Backspace') {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              if (range.collapsed) {
                // Check if we're right after a chip
                const container = range.startContainer;
                const offset = range.startOffset;

                if (container.nodeType === Node.TEXT_NODE && offset === 0) {
                  // At start of text node, check previous sibling
                  const prev = container.previousSibling;
                  if (prev instanceof HTMLElement && prev.hasAttribute(CHIP_DATA_ATTR)) {
                    e.preventDefault();
                    prev.remove();
                    handleInput();
                    return;
                  }
                } else if (container.nodeType === Node.ELEMENT_NODE) {
                  // In element, check child at offset - 1
                  const prevChild = (container as Element).childNodes[offset - 1];
                  if (prevChild instanceof HTMLElement && prevChild.hasAttribute(CHIP_DATA_ATTR)) {
                    e.preventDefault();
                    prevChild.remove();
                    handleInput();
                    return;
                  }
                }
              }
            }
          }
        },
        [parseContent, onSubmit, handleInput]
      );

      // Handle paste - strip formatting
      const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
      }, []);

      // Handle composition (for IME input)
      const handleCompositionStart = useCallback(() => {
        isComposingRef.current = true;
      }, []);

      const handleCompositionEnd = useCallback(() => {
        isComposingRef.current = false;
        handleInput();
      }, [handleInput]);

      // Auto-resize based on content
      useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const adjustHeight = () => {
          editor.style.height = 'auto';
          editor.style.height = `${Math.min(editor.scrollHeight, maxHeight)}px`;
        };

        adjustHeight();
        const observer = new MutationObserver(adjustHeight);
        observer.observe(editor, { childList: true, subtree: true, characterData: true });

        return () => observer.disconnect();
      }, [maxHeight]);

      // Sync external value/chips changes to DOM
      useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        // Only sync if chips changed (external insert)
        const chipsChanged =
          chips.length !== lastChipsRef.current.length ||
          chips.some((c, i) => lastChipsRef.current[i]?.id !== c.id);

        if (chipsChanged && chips.length > lastChipsRef.current.length) {
          // New chip was added externally - find and insert it
          // Skip chips that were inserted internally (already in insertedChipsRef)
          const newChip = chips.find(
            (c) =>
              !lastChipsRef.current.some((lc) => lc.id === c.id) &&
              !insertedChipsRef.current.has(c.id)
          );
          if (newChip) {
            insertChip(newChip);
          }
        }

        // Clean up insertedChipsRef - remove entries for chips no longer in the DOM
        // This prevents memory leaks from accumulating stale entries
        if (insertedChipsRef.current.size > 0) {
          const activeChipIds = new Set(chips.map((c) => c.id));
          for (const chipId of insertedChipsRef.current.keys()) {
            if (activeChipIds.has(chipId)) {
              // Chip is now in props, we can remove it from insertedChipsRef
              // as parseContent will find it via props
              insertedChipsRef.current.delete(chipId);
            }
          }
        }

        lastChipsRef.current = chips;
      }, [chips, insertChip]);

      // Auto-focus on mount
      useEffect(() => {
        if (autoFocus && editorRef.current) {
          editorRef.current.focus();
        }
      }, [autoFocus]);

      // Expose ref methods
      useImperativeHandle(
        ref,
        () => ({
          focus: () => editorRef.current?.focus(),
          insertChip,
          insertChipReplacingText,
          getElement: () => editorRef.current,
        }),
        [insertChip, insertChipReplacingText]
      );

      return (
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable={!disabled}
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            className={cn(
              'min-h-[66px] w-full rounded-md bg-transparent px-0 py-2 text-sm outline-none text-left',
              'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none',
              disabled && 'cursor-not-allowed opacity-50',
              className
            )}
            data-placeholder={placeholder}
            role="textbox"
            aria-multiline="true"
            aria-disabled={disabled}
            style={{ maxHeight, overflowY: 'auto' }}
          />
        </div>
      );
    }
  )
);

RichTextInput.displayName = 'RichTextInput';
