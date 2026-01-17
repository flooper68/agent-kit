import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type {
  SlashCommandOption,
  SlashCommandChip,
  RichTextInputRef,
} from '@agent-kit/ui';
import { trpc } from '../lib/trpc';
import { useSlashCommandDetection } from './useSlashCommandDetection';

export interface UseSlashCommandsOptions {
  /** Initial input value */
  initialValue?: string;
  /** Initial chips */
  initialChips?: SlashCommandChip[];
}

export interface UseSlashCommandsReturn {
  /** Current input value */
  inputValue: string;
  /** Set input value */
  setInputValue: (value: string) => void;
  /** Handle input value change (for onValueChange callback) */
  handleInputValueChange: (value: string) => void;
  /** Current chips */
  chips: SlashCommandChip[];
  /** Set chips */
  setChips: (chips: SlashCommandChip[]) => void;
  /** Handle chips change (for onChipsChange callback) */
  handleChipsChange: (chips: SlashCommandChip[]) => void;
  /** Current cursor position */
  cursorPosition: number;
  /** Handle cursor position change (for RichTextInput callback) */
  handleCursorPositionChange: (position: number) => void;
  /** Slash command context from detection */
  slashCommandContext: ReturnType<typeof useSlashCommandDetection>;
  /** Available slash commands for autocomplete */
  slashCommands: SlashCommandOption[];
  /** Whether slash commands are loading */
  isLoadingCommands: boolean;
  /** Whether autocomplete should be shown */
  shouldShowAutocomplete: boolean;
  /** Handle selecting a slash command from autocomplete */
  handleSlashCommandSelect: (command: SlashCommandOption) => void;
  /** Handle closing autocomplete (Escape key) */
  handleAutocompleteClose: () => void;
  /** Memoized anchor ref for CommandAutocomplete */
  autocompleteAnchorRef: React.RefObject<HTMLElement | null>;
  /** Ref for the rich text input (set via callback ref) */
  richTextInputRef: React.MutableRefObject<RichTextInputRef | null>;
  /** Callback ref to set the rich text input ref */
  handleRichTextInputRef: (ref: RichTextInputRef | null) => void;
  /** Clear input and chips (e.g., after sending a message) */
  clearInput: () => void;
}

/**
 * Hook to manage slash command state and behavior.
 *
 * Encapsulates:
 * - Input value and chips state
 * - Slash command detection
 * - Autocomplete query and filtering
 * - Command selection and chip insertion
 */
export function useSlashCommands(
  options: UseSlashCommandsOptions = {}
): UseSlashCommandsReturn {
  const { initialValue = '', initialChips = [] } = options;

  // Rich text input ref
  const richTextInputRef = useRef<RichTextInputRef | null>(null);
  // Track previous input value to detect changes
  const prevInputRef = useRef(initialValue);

  // Input state
  const [inputValue, setInputValue] = useState(initialValue);
  const [chips, setChips] = useState<SlashCommandChip[]>(initialChips);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [autocompleteHidden, setAutocompleteHidden] = useState(false);

  // Debounce cursor position updates to reduce flickering
  const cursorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Slash command detection (now cursor-aware)
  const slashCommandContext = useSlashCommandDetection(
    inputValue,
    cursorPosition
  );

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (cursorDebounceRef.current) {
        clearTimeout(cursorDebounceRef.current);
      }
    };
  }, []);

  // Reset autocomplete hidden state when input changes (user starts typing again)
  useEffect(() => {
    if (inputValue !== prevInputRef.current) {
      setAutocompleteHidden(false);
      prevInputRef.current = inputValue;
    }
  }, [inputValue]);

  // Query for slash commands (for autocomplete)
  const slashCommandsQuery = trpc.slashCommands.search.useQuery(
    { query: slashCommandContext.searchQuery, limit: 10 },
    {
      enabled:
        slashCommandContext.shouldShowAutocomplete && !autocompleteHidden,
    }
  );

  // Map server slash commands to UI format
  const slashCommands: SlashCommandOption[] = useMemo(() => {
    return (slashCommandsQuery.data?.items ?? []).map((cmd) => ({
      id: cmd.id,
      key: cmd.key,
      name: cmd.name,
      description: cmd.description,
      prompt: cmd.prompt,
    }));
  }, [slashCommandsQuery.data?.items]);

  // Memoized anchor ref for CommandAutocomplete to avoid recreation on every render
  const autocompleteAnchorRef = useMemo(
    () => ({
      get current() {
        return richTextInputRef.current?.getElement() ?? null;
      },
    }),
    []
  );

  // Handle input value change
  const handleInputValueChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  // Handle chips change
  const handleChipsChange = useCallback((newChips: SlashCommandChip[]) => {
    setChips(newChips);
  }, []);

  // Handle cursor position change (from RichTextInput) - debounced to reduce flickering
  const handleCursorPositionChange = useCallback((position: number) => {
    // Clear any pending debounce
    if (cursorDebounceRef.current) {
      clearTimeout(cursorDebounceRef.current);
    }

    // Debounce the state update (50ms is fast enough to feel responsive but reduces flicker)
    // Capture position in closure to avoid stale ref issues
    cursorDebounceRef.current = setTimeout(() => {
      setCursorPosition(position);
      cursorDebounceRef.current = null;
    }, 50);
  }, []);

  // Handle closing autocomplete (Escape key) - hide without clearing input
  const handleAutocompleteClose = useCallback(() => {
    setAutocompleteHidden(true);
  }, []);

  // Handle slash command selection - replace slash text with chip
  const handleSlashCommandSelect = useCallback(
    (command: SlashCommandOption) => {
      // Create chip from command
      const chip: SlashCommandChip = {
        id: `${command.id}-${Date.now()}`,
        key: command.key,
        name: command.name,
        prompt: command.prompt,
      };

      // Calculate how many characters to delete (the "/" plus the search query)
      // e.g., "/sum" = 4 characters to delete
      const charsToDelete = slashCommandContext.searchQuery.length + 1; // +1 for the "/"

      // Insert chip via rich text input ref, replacing the slash command text
      if (richTextInputRef.current) {
        richTextInputRef.current.insertChipReplacingText(chip, charsToDelete);
      }
    },
    [slashCommandContext.searchQuery]
  );

  // Callback ref for rich text input
  const handleRichTextInputRef = useCallback((ref: RichTextInputRef | null) => {
    richTextInputRef.current = ref;
  }, []);

  // Clear input and chips (e.g., after sending a message)
  const clearInput = useCallback(() => {
    setInputValue('');
    setChips([]);
    setCursorPosition(0);
  }, []);

  // Computed value for whether autocomplete should show
  const shouldShowAutocomplete =
    slashCommandContext.shouldShowAutocomplete && !autocompleteHidden;

  return {
    inputValue,
    setInputValue,
    handleInputValueChange,
    chips,
    setChips,
    handleChipsChange,
    cursorPosition,
    handleCursorPositionChange,
    slashCommandContext,
    slashCommands,
    isLoadingCommands: slashCommandsQuery.isLoading,
    shouldShowAutocomplete,
    handleSlashCommandSelect,
    handleAutocompleteClose,
    autocompleteAnchorRef,
    richTextInputRef,
    handleRichTextInputRef,
    clearInput,
  };
}
