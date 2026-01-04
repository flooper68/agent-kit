import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const labelVariants = cva('font-sans text-foreground inline-block', {
  variants: {
    size: {
      '20': 'text-label-20',
      '16': 'text-label-16',
      '14': 'text-label-14',
      '13': 'text-label-13',
      '12': 'text-label-12',
    },
    variant: {
      default: '',
      strong: 'font-semibold',
      muted: 'text-muted-foreground',
    },
    mono: {
      true: 'font-mono',
      false: '',
    },
  },
  defaultVariants: {
    size: '14',
    variant: 'default',
    mono: false,
  },
});

export interface LabelProps
  extends
    React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, size, variant, mono, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(labelVariants({ size, variant, mono }), className)}
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = 'Label';

export { labelVariants };
