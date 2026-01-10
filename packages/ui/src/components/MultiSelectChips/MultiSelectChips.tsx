import { useState, useMemo, useRef } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown, Loader2, Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Tooltip } from '../Tooltip';

export interface MultiSelectOption {
  /** Unique value identifier */
  value: string;
  /** Display label */
  label: string;
  /** Optional description shown in tooltip */
  description?: string;
  /** Optional badge text (e.g., "Server", "External") */
  badge?: string;
  /** Badge color variant */
  badgeVariant?: 'default' | 'secondary';
  /** Whether this option is disabled */
  disabled?: boolean;
}

export interface MultiSelectChipsProps {
  /** Currently selected values */
  value: string[];
  /** Callback when selection changes */
  onChange: (values: string[]) => void;
  /** Available options to select from */
  options: MultiSelectOption[];
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Label for add button when no items selected */
  addLabel?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether the component is loading options */
  isLoading?: boolean;
  /** Optional className */
  className?: string;
  /** Called when the dropdown closes (for autosave) */
  onBlur?: () => void;
}

export function MultiSelectChips({
  value,
  onChange,
  options,
  placeholder = 'Search...',
  addLabel = 'Add',
  disabled = false,
  isLoading = false,
  className,
  onBlur,
}: MultiSelectChipsProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Get selected options for chip display
  const selectedOptions = useMemo(() => {
    return value
      .map((v) => options.find((o) => o.value === v))
      .filter((o): o is MultiSelectOption => o !== undefined);
  }, [value, options]);

  // Filter available options (not selected, matches search)
  const availableOptions = useMemo(() => {
    return options.filter((o) => {
      if (value.includes(o.value)) return false;
      if (o.disabled) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          o.label.toLowerCase().includes(searchLower) ||
          o.description?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [options, value, search]);

  const handleRemove = (valueToRemove: string) => {
    if (disabled) return;
    onChange(value.filter((v) => v !== valueToRemove));
  };

  const handleAdd = (valueToAdd: string) => {
    if (disabled) return;
    onChange([...value, valueToAdd]);
    setSearch('');
    setOpen(false);
    onBlur?.();
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearch('');
      onBlur?.();
    } else {
      // Focus input when opening
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Chips display area */}
      <div className="flex flex-wrap items-center gap-2">
        {selectedOptions.map((option) => (
          <Tooltip
            key={option.value}
            content={
              <div className="max-w-xs space-y-1">
                <div className="font-medium">{option.label}</div>
                {option.description && (
                  <div className="text-xs opacity-90 line-clamp-2">
                    {option.description}
                  </div>
                )}
                {option.badge && (
                  <div className="text-xs opacity-75">Type: {option.badge}</div>
                )}
              </div>
            }
            side="top"
          >
            <div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1',
                'bg-secondary text-secondary-foreground text-sm',
                'border border-border',
                disabled && 'opacity-50'
              )}
            >
              <span className="max-w-[150px] truncate">{option.label}</span>
              {option.badge && (
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded',
                    option.badgeVariant === 'secondary'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary/10 text-primary'
                  )}
                >
                  {option.badge}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(option.value)}
                disabled={disabled}
                className={cn(
                  'ml-0.5 rounded-sm hover:bg-accent p-0.5',
                  'focus:outline-none focus:ring-1 focus:ring-ring',
                  'disabled:pointer-events-none'
                )}
                aria-label={`Remove ${option.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </Tooltip>
        ))}

        {/* Add button / Popover trigger */}
        <Popover.Root open={open} onOpenChange={handleOpenChange}>
          <Popover.Trigger asChild>
            <button
              type="button"
              disabled={disabled || isLoading}
              aria-expanded={open}
              aria-haspopup="listbox"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1',
                'border border-dashed border-border text-sm text-muted-foreground',
                'hover:bg-accent hover:text-accent-foreground hover:border-solid',
                'focus:outline-none focus:ring-1 focus:ring-ring',
                'disabled:opacity-50 disabled:pointer-events-none',
                'transition-colors'
              )}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {addLabel}
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform',
                  open && 'rotate-180'
                )}
              />
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              className={cn(
                'z-50 w-72 rounded-md border bg-popover p-2 text-popover-foreground shadow-md',
                'data-[state=open]:animate-in data-[state=closed]:animate-out',
                'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                'data-[side=bottom]:slide-in-from-top-2',
                'data-[side=top]:slide-in-from-bottom-2'
              )}
              sideOffset={5}
              align="start"
            >
              {/* Search input */}
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className={cn(
                  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                  'placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-1 focus:ring-ring'
                )}
              />

              {/* Options list */}
              <div className="mt-2 max-h-60 overflow-y-auto">
                {availableOptions.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {search ? 'No matching options' : 'No options available'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {availableOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleAdd(option.value)}
                        className={cn(
                          'w-full flex items-start gap-2 rounded-md px-2 py-2 text-left text-sm',
                          'hover:bg-accent hover:text-accent-foreground',
                          'focus:outline-none focus:bg-accent focus:text-accent-foreground',
                          'transition-colors'
                        )}
                      >
                        <Check className="h-4 w-4 mt-0.5 opacity-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">
                              {option.label}
                            </span>
                            {option.badge && (
                              <span
                                className={cn(
                                  'text-xs px-1.5 py-0.5 rounded shrink-0',
                                  option.badgeVariant === 'secondary'
                                    ? 'bg-muted text-muted-foreground'
                                    : 'bg-primary/10 text-primary'
                                )}
                              >
                                {option.badge}
                              </span>
                            )}
                          </div>
                          {option.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {option.description}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      {/* Empty state message */}
      {selectedOptions.length === 0 && !isLoading && (
        <p className="mt-2 text-xs text-muted-foreground">
          No items selected. Click &ldquo;{addLabel}&rdquo; to add.
        </p>
      )}
    </div>
  );
}

MultiSelectChips.displayName = 'MultiSelectChips';
