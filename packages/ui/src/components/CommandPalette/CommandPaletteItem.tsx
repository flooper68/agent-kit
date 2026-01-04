import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import type { Command } from './types';

interface CommandPaletteItemProps {
  command: Command;
  isSelected: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
}

export function CommandPaletteItem({
  command,
  isSelected,
  onSelect,
  onMouseEnter,
}: CommandPaletteItemProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isSelected]);

  return (
    <button
      ref={ref}
      id={`command-${command.id}`}
      type="button"
      role="option"
      aria-selected={isSelected}
      aria-disabled={command.disabled}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm',
        'transition-colors cursor-pointer text-left',
        isSelected && 'bg-accent text-accent-foreground',
        !isSelected && 'hover:bg-muted',
        command.disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      disabled={command.disabled}
    >
      {command.icon && (
        <span className="h-4 w-4 shrink-0 text-muted-foreground">
          {command.icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{command.label}</div>
        {command.description && (
          <div className="text-xs text-muted-foreground truncate">
            {command.description}
          </div>
        )}
      </div>
      {command.shortcut && (
        <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border shrink-0">
          {command.shortcut}
        </kbd>
      )}
    </button>
  );
}
