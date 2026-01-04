import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const textVariants = cva('font-sans text-foreground', {
  variants: {
    size: {
      '24': 'text-copy-24',
      '20': 'text-copy-20',
      '16': 'text-copy-16',
      '14': 'text-copy-14',
      '13': 'text-copy-13',
    },
    variant: {
      default: '',
      strong: 'font-semibold',
      muted: 'text-muted-foreground',
      success: 'text-success',
      warning: 'text-warning',
      destructive: 'text-destructive',
      info: 'text-info',
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

type TextElement = 'p' | 'span' | 'div';

export interface TextProps
  extends
    React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  as?: TextElement;
}

export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, size, variant, mono, as = 'p', children, ...props }, ref) => {
    const Component = as;

    return (
      <Component
        ref={ref}
        className={cn(textVariants({ size, variant, mono }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = 'Text';

export { textVariants };
