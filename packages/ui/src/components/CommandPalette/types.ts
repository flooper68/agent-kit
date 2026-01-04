import type { ReactNode } from 'react';

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  shortcut?: string;
  keywords?: string[];
  onSelect: () => void;
  disabled?: boolean;
  /** If true, the palette will stay open after selecting this command */
  keepOpen?: boolean;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}
