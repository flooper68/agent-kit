import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const codeVariants = cva('font-mono rounded px-1.5 py-0.5', {
  variants: {
    size: {
      '14': 'text-label-14',
      '13': 'text-label-13',
      '12': 'text-label-12',
    },
    variant: {
      default: 'bg-muted text-foreground',
      ghost: 'text-foreground',
    },
  },
  defaultVariants: {
    size: '13',
    variant: 'default',
  },
});

export interface CodeProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof codeVariants> {}

export const Code = forwardRef<HTMLElement, CodeProps>(
  ({ className, size, variant, children, ...props }, ref) => {
    return (
      <code
        ref={ref}
        className={cn(codeVariants({ size, variant }), className)}
        {...props}
      >
        {children}
      </code>
    );
  }
);

Code.displayName = 'Code';

export { codeVariants };
