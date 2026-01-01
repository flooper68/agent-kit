import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

const selectVariants = cva(
  [
    'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'appearance-none cursor-pointer',
  ],
  {
    variants: {
      variant: {
        default: 'border-input',
        error: 'border-destructive focus:ring-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, options, placeholder, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(selectVariants({ variant }), className)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    );
  }
);

Select.displayName = 'Select';
