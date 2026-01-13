import { forwardRef, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const checkboxVariants = cva(
  'shrink-0 flex items-center justify-center rounded border transition-colors',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const checkmarkVariants = cva('', {
  variants: {
    size: {
      sm: 'h-3 w-3',
      md: 'h-3.5 w-3.5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface CheckboxProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'size' | 'onChange'
    >,
    VariantProps<typeof checkboxVariants> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
}

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="3"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      size,
      checked = false,
      onChange,
      label,
      disabled,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId ?? generatedId;

    return (
      <label
        className={cn(
          'inline-flex items-center gap-2 cursor-pointer',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
        htmlFor={id}
      >
        <input
          ref={ref}
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div
          aria-hidden="true"
          className={cn(
            checkboxVariants({ size }),
            'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
            checked
              ? 'bg-info border-info text-info-foreground'
              : 'border-input bg-background hover:bg-muted/50'
          )}
        >
          {checked && <CheckIcon className={checkmarkVariants({ size })} />}
        </div>
        {label && <span className="text-sm select-none">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
