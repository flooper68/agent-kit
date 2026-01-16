import {
  forwardRef,
  memo,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../../lib/utils';

export interface SlashCommandOption {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  prompt: string;
}

export interface CommandAutocompleteProps {
  /** Current input value to extract search query from */
  value: string;
  /** Anchor element to position dropdown relative to */
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Available slash commands */
  commands: SlashCommandOption[];
  /** Whether the autocomplete is loading */
  isLoading?: boolean;
  /** Callback when a command is selected */
  onSelect: (command: SlashCommandOption) => void;
  /** Callback to close the autocomplete */
  onClose: () => void;
  /** Whether the dropdown is open */
  open: boolean;
}

export const CommandAutocomplete = memo(
  forwardRef<HTMLDivElement, CommandAutocompleteProps>(
    (
      { value, anchorRef, commands, isLoading, onSelect, onClose, open },
      ref
    ) => {
      const [selectedIndex, setSelectedIndex] = useState(0);
      const listRef = useRef<HTMLDivElement>(null);
      const [dropdownPosition, setDropdownPosition] = useState<{
        top: number;
        left: number;
        width: number;
      } | null>(null);

      // Extract search query from input (text after last "/")
      const searchQuery = useMemo(() => {
        const lastSlashIndex = value.lastIndexOf('/');
        if (lastSlashIndex === -1) return '';
        return value.slice(lastSlashIndex + 1).toLowerCase();
      }, [value]);

      // Filter commands based on search query
      const filteredCommands = useMemo(() => {
        if (!searchQuery) return commands;
        return commands.filter(
          (cmd) =>
            cmd.key.toLowerCase().includes(searchQuery) ||
            cmd.name.toLowerCase().includes(searchQuery)
        );
      }, [commands, searchQuery]);

      // Reset selection when filtered commands change
      useEffect(() => {
        setSelectedIndex(0);
      }, [filteredCommands.length]);

      // Scroll selected item into view
      useEffect(() => {
        if (listRef.current && filteredCommands.length > 0) {
          const selectedElement = listRef.current.children[
            selectedIndex
          ] as HTMLElement;
          if (selectedElement) {
            selectedElement.scrollIntoView({ block: 'nearest' });
          }
        }
      }, [selectedIndex, filteredCommands.length]);

      // Keyboard navigation
      useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
          switch (e.key) {
            case 'ArrowDown':
              e.preventDefault();
              e.stopPropagation();
              setSelectedIndex((prev) =>
                prev < filteredCommands.length - 1 ? prev + 1 : 0
              );
              break;
            case 'ArrowUp':
              e.preventDefault();
              e.stopPropagation();
              setSelectedIndex((prev) =>
                prev > 0 ? prev - 1 : filteredCommands.length - 1
              );
              break;
            case 'Enter':
            case 'Tab': {
              const selected = filteredCommands[selectedIndex];
              if (selected) {
                e.preventDefault();
                e.stopPropagation();
                onSelect(selected);
              }
              break;
            }
            case 'Escape':
              e.preventDefault();
              e.stopPropagation();
              onClose();
              break;
          }
        };

        document.addEventListener('keydown', handleKeyDown, true);
        return () =>
          document.removeEventListener('keydown', handleKeyDown, true);
      }, [open, filteredCommands, selectedIndex, onSelect, onClose]);

      // Calculate dropdown position when opening
      useLayoutEffect(() => {
        if (open && anchorRef.current) {
          const rect = anchorRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.top - 4,
            left: rect.left,
            width: Math.min(rect.width, 400),
          });
        }
      }, [open, anchorRef]);

      const handleSelect = useCallback(
        (command: SlashCommandOption) => {
          onSelect(command);
        },
        [onSelect]
      );

      if (!open || !dropdownPosition) return null;

      // Get the currently selected command for the detail panel
      const selectedCommand = filteredCommands[selectedIndex];

      return createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <div
            ref={ref}
            className="fixed z-50 flex items-end gap-2"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              transform: 'translateY(-100%)',
            }}
          >
            {/* Command list (left) - shows only keys */}
            <div
              className="rounded-md border bg-popover shadow-md overflow-hidden"
              style={{
                width: Math.min(dropdownPosition.width, 280),
                maxWidth: 280,
              }}
            >
              <div ref={listRef} className="max-h-64 overflow-y-auto py-1">
                {isLoading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Loading commands...
                  </div>
                ) : filteredCommands.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {commands.length === 0
                      ? 'No commands available'
                      : 'No commands found'}
                  </div>
                ) : (
                  filteredCommands.map((command, index) => (
                    <button
                      key={command.id}
                      type="button"
                      className={cn(
                        'w-full px-3 py-1.5 text-left text-sm transition-colors flex items-center gap-2',
                        index === selectedIndex
                          ? 'bg-accent'
                          : 'hover:bg-accent/50'
                      )}
                      onClick={() => handleSelect(command)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <span className="font-mono text-primary">
                        /{command.key}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Detail panel (right) - shows title, description, and prompt */}
            {selectedCommand && (selectedCommand.name || selectedCommand.description || selectedCommand.prompt) && (
              <div
                className="rounded-md border bg-popover shadow-md p-3 w-72 max-h-80 overflow-y-auto self-end"
              >
                <div className="text-sm font-medium text-foreground mb-1">
                  {selectedCommand.name}
                </div>
                {selectedCommand.description && (
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {selectedCommand.description}
                  </div>
                )}
                {selectedCommand.prompt && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70 mb-1">
                      Prompt
                    </div>
                    <div className="text-[11px] text-muted-foreground/90 leading-relaxed font-mono">
                      {selectedCommand.prompt}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>,
        document.body
      );
    }
  )
);

CommandAutocomplete.displayName = 'CommandAutocomplete';
