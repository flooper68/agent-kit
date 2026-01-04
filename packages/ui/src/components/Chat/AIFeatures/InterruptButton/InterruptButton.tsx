import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';
import { Button, type ButtonProps } from '../../../Button';

export interface InterruptButtonProps extends Omit<ButtonProps, 'children'> {
  label?: string;
}

export const InterruptButton = forwardRef<
  HTMLButtonElement,
  InterruptButtonProps
>(({ label = 'Stop generating', className, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="outline"
      size="sm"
      className={cn('gap-2 animate-pulse', className)}
      {...props}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
        />
      </svg>
      {label}
    </Button>
  );
});

InterruptButton.displayName = 'InterruptButton';
