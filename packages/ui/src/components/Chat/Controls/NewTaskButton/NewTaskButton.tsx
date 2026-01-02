import { forwardRef } from 'react';
import { Plus } from 'lucide-react';
import { IconButton } from '../../../IconButton';
import { Tooltip } from '../../../Tooltip';

export interface NewTaskButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  tooltip?: string;
}

export const NewTaskButton = forwardRef<HTMLButtonElement, NewTaskButtonProps>(
  ({ tooltip = 'New task', ...props }, ref) => {
    return (
      <Tooltip content={tooltip}>
        <IconButton
          ref={ref}
          icon={<Plus className="h-4 w-4" />}
          label={tooltip}
          size="sm"
          {...props}
        />
      </Tooltip>
    );
  }
);

NewTaskButton.displayName = 'NewTaskButton';
