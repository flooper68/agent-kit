import { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Button, type ButtonProps } from '../Button';

export interface IconButtonProps extends Omit<ButtonProps, 'size'> {
  icon: React.ReactNode;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-9 w-9',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { icon, label, className, size = 'md', variant = 'ghost', ...props },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size="icon"
        className={cn(sizeClasses[size], 'p-0', className)}
        aria-label={label}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
