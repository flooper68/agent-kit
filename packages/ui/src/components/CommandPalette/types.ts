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
  /** Optional function that returns the element to focus after the command palette closes.
   * Use this when the command needs to focus a specific element, to prevent
   * the dialog's default focus restoration from overriding it. */
  getFocusTarget?: () => HTMLElement | null;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}
