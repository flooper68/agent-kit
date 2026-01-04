import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const headingVariants = cva('font-sans text-foreground', {
  variants: {
    size: {
      '72': 'text-heading-72',
      '64': 'text-heading-64',
      '56': 'text-heading-56',
      '48': 'text-heading-48',
      '40': 'text-heading-40',
      '32': 'text-heading-32',
      '24': 'text-heading-24',
      '20': 'text-heading-20',
      '16': 'text-heading-16',
      '14': 'text-heading-14',
    },
    variant: {
      default: '',
      subtle: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    size: '24',
    variant: 'default',
  },
});

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface HeadingProps
  extends
    React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: HeadingLevel;
}

function getDefaultLevel(size: string | null | undefined): HeadingLevel {
  switch (size) {
    case '72':
    case '64':
    case '56':
      return 'h1';
    case '48':
    case '40':
      return 'h2';
    case '32':
    case '24':
      return 'h3';
    case '20':
    case '16':
      return 'h4';
    case '14':
      return 'h5';
    default:
      return 'h3';
  }
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, size, variant, as, children, ...props }, ref) => {
    const Component = as ?? getDefaultLevel(size);

    return (
      <Component
        ref={ref}
        className={cn(headingVariants({ size, variant }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Heading.displayName = 'Heading';

export { headingVariants };
