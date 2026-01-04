import { useState, useEffect, useCallback } from 'react';
import type { Command } from './types';

export function useCommandPaletteKeyboard(
  filteredCommands: Command[],
  onSelect: (command: Command) => void,
  onClose: () => void
) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selection when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter': {
          e.preventDefault();
          const selected = filteredCommands[selectedIndex];
          if (selected && !selected.disabled) {
            onSelect(selected);
          }
          break;
        }
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredCommands, selectedIndex, onSelect, onClose]
  );

  return { selectedIndex, setSelectedIndex, handleKeyDown };
}
