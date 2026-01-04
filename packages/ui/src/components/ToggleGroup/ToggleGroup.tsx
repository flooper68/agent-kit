import { createContext, useContext, forwardRef } from 'react';
import { cn } from '../../lib/utils';

type ToggleGroupContextValue = {
  value: string | string[];
  onValueChange: (value: string) => void;
  type: 'single' | 'multiple';
};

const ToggleGroupContext = createContext<ToggleGroupContextValue | undefined>(
  undefined
);

export interface ToggleGroupProps {
  type?: 'single' | 'multiple';
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  children: React.ReactNode;
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Full width toggle items */
  fullWidth?: boolean;
}

export type ToggleGroupItemColorScheme =
  | 'default'
  | 'slate'
  | 'blue'
  | 'amber'
  | 'green'
  | 'orange'
  | 'red';

export interface ToggleGroupItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  /** Color scheme when selected */
  colorScheme?: ToggleGroupItemColorScheme;
}

const sizeClasses = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-8 px-3 text-sm',
  lg: 'h-9 px-4 text-sm',
};

const colorSchemeClasses: Record<ToggleGroupItemColorScheme, string> = {
  default: 'bg-primary text-primary-foreground',
  slate: 'bg-slate-600 text-white',
  blue: 'bg-blue-600 text-white',
  amber: 'bg-amber-600 text-white',
  green: 'bg-green-600 text-white',
  orange: 'bg-orange-600 text-white',
  red: 'bg-red-600 text-white',
};

export function ToggleGroup({
  type = 'single',
  value,
  onValueChange,
  children,
  className,
  size = 'md',
  fullWidth = false,
}: ToggleGroupProps) {
  const handleValueChange = (itemValue: string) => {
    if (type === 'single') {
      onValueChange(itemValue);
    } else {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(itemValue)) {
        onValueChange(currentValues.filter((v) => v !== itemValue));
      } else {
        onValueChange([...currentValues, itemValue]);
      }
    }
  };

  return (
    <ToggleGroupContext.Provider
      value={{ value, onValueChange: handleValueChange, type }}
    >
      <div
        className={cn(
          'inline-flex items-center rounded-md border border-input bg-background p-0.5',
          fullWidth && 'w-full',
          className
        )}
        role="group"
        data-size={size}
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
}

export const ToggleGroupItem = forwardRef<
  HTMLButtonElement,
  ToggleGroupItemProps
>(
  (
    {
      value,
      children,
      className,
      disabled = false,
      colorScheme = 'default',
      onClick,
      ...props
    },
    ref
  ) => {
    const context = useContext(ToggleGroupContext);

    if (!context) {
      throw new Error('ToggleGroupItem must be used within a ToggleGroup');
    }

    const isSelected =
      context.type === 'single'
        ? context.value === value
        : Array.isArray(context.value) && context.value.includes(value);

    const size =
      (context as unknown as { size?: 'sm' | 'md' | 'lg' }).size || 'md';

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        context.onValueChange(value);
      }
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={isSelected}
        data-state={isSelected ? 'on' : 'off'}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          sizeClasses[size],
          isSelected
            ? [colorSchemeClasses[colorScheme], 'shadow-sm']
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          className
        )}
        {...props}
        onClick={handleClick}
      >
        {children}
      </button>
    );
  }
);

ToggleGroup.displayName = 'ToggleGroup';
ToggleGroupItem.displayName = 'ToggleGroupItem';
ToggleGroup.Item = ToggleGroupItem;
