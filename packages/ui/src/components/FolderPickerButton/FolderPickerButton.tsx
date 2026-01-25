import { forwardRef } from 'react';
import { Folder, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FolderPickerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  folderName?: string;
  placeholder?: string;
}

export const FolderPickerButton = forwardRef<
  HTMLButtonElement,
  FolderPickerButtonProps
>(
  (
    {
      folderName,
      placeholder = 'Select Folder',
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm',
          'transition-colors hover:bg-accent hover:text-accent-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        {...props}
      >
        <Folder className="h-4 w-4 text-muted-foreground" />
        <span
          className={cn(
            'flex-1 text-left',
            folderName ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {folderName || placeholder}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    );
  }
);

FolderPickerButton.displayName = 'FolderPickerButton';
