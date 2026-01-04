import { forwardRef } from 'react';
import { Command } from 'lucide-react';
import { IconButton } from '../../../IconButton';
import { Tooltip } from '../../../Tooltip';

export interface CommandPaletteButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  tooltip?: string;
}

export const CommandPaletteButton = forwardRef<
  HTMLButtonElement,
  CommandPaletteButtonProps
>(({ tooltip = 'Command palette (⌘P)', ...props }, ref) => {
  return (
    <Tooltip content={tooltip}>
      <IconButton
        ref={ref}
        icon={<Command className="h-4 w-4" />}
        label={tooltip}
        size="sm"
        {...props}
      />
    </Tooltip>
  );
});

CommandPaletteButton.displayName = 'CommandPaletteButton';
