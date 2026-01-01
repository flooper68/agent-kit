import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const spinnerVariants = cva(
  'animate-spin rounded-full border-2 border-current border-t-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
      },
      color: {
        primary: 'text-primary',
        muted: 'text-muted-foreground',
        current: 'text-current',
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'primary',
    },
  }
);

export interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
}

export function Spinner({ size, color, className }: SpinnerProps) {
  return (
    <div
      className={cn(spinnerVariants({ size, color }), className)}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
