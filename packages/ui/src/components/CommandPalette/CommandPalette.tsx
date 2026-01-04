import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useId,
} from 'react';
import { Search } from 'lucide-react';
import { Dialog } from '../Dialog';
import { cn } from '../../lib/utils';
import { CommandPaletteItem } from './CommandPaletteItem';
import { useCommandPaletteKeyboard } from './useCommandPaletteKeyboard';
import type { Command, CommandPaletteProps } from './types';

function filterCommands(commands: Command[], query: string): Command[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return commands;

  // Split query into tokens (space-separated)
  const queryTokens = lowerQuery.split(/\s+/).filter(Boolean);

  return commands.filter((cmd) => {
    const searchText = [cmd.label, cmd.description, ...(cmd.keywords ?? [])]
      .join(' ')
      .toLowerCase();

    // Split search text into words
    const words = searchText.split(/\s+/);

    // Each query token must match the start of at least one word
    return queryTokens.every((token) =>
      words.some((word) => word.startsWith(token))
    );
  });
}

export function CommandPalette({
  open,
  onOpenChange,
  commands,
  placeholder = 'Search commands...',
  emptyMessage = 'No commands found.',
  className,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const filteredCommands = useMemo(
    () => filterCommands(commands, query),
    [commands, query]
  );

  const handleSelect = useCallback(
    (cmd: Command) => {
      cmd.onSelect();
      if (!cmd.keepOpen) {
        onOpenChange(false);
      }
      setQuery('');
    },
    [onOpenChange]
  );

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setQuery('');
  }, [onOpenChange]);

  const { selectedIndex, setSelectedIndex, handleKeyDown } =
    useCommandPaletteKeyboard(filteredCommands, handleSelect, handleClose);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      // Small delay to ensure dialog is mounted
      const timer = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        size="md"
        className={cn(
          'p-0 overflow-hidden',
          // Override center positioning - fix at top so input doesn't move when filtering
          'top-[10%] translate-y-0',
          className
        )}
        onEscapeKeyDown={handleClose}
      >
        {/* Search Input */}
        <div className="flex items-center border-b border-border px-3">
          <Search
            className="h-4 w-4 text-muted-foreground shrink-0"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={filteredCommands.length > 0}
            aria-controls={listboxId}
            aria-activedescendant={
              filteredCommands[selectedIndex]
                ? `command-${filteredCommands[selectedIndex].id}`
                : undefined
            }
            aria-autocomplete="list"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              'flex-1 h-12 px-3 bg-transparent text-sm',
              'placeholder:text-muted-foreground',
              'focus:outline-none'
            )}
          />
        </div>

        {/* Command List */}
        <div
          id={listboxId}
          role="listbox"
          aria-label="Commands"
          className="max-h-[300px] overflow-y-auto p-1"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <CommandPaletteItem
                key={cmd.id}
                command={cmd}
                isSelected={index === selectedIndex}
                onSelect={() => handleSelect(cmd)}
                onMouseEnter={() => setSelectedIndex(index)}
              />
            ))
          )}
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
