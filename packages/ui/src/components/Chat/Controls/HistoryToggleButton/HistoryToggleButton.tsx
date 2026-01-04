import { forwardRef } from 'react';
import { History } from 'lucide-react';
import { IconButton } from '../../../IconButton';
import { Tooltip } from '../../../Tooltip';

export interface HistoryToggleButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  tooltip?: string;
}

export const HistoryToggleButton = forwardRef<
  HTMLButtonElement,
  HistoryToggleButtonProps
>(({ tooltip = 'Chat history', ...props }, ref) => {
  return (
    <Tooltip content={tooltip}>
      <IconButton
        ref={ref}
        icon={<History className="h-4 w-4" />}
        label={tooltip}
        size="sm"
        {...props}
      />
    </Tooltip>
  );
});

HistoryToggleButton.displayName = 'HistoryToggleButton';
