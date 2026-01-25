import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TagBadge, getTagColor, type TagColorPreset } from '../TagBadge';

export interface Tag {
  id: string;
  label: string;
  color?: TagColorPreset;
}

// Tag validation constants (matching backend schema)
const MIN_TAG_LENGTH = 2;
const MAX_TAG_LENGTH = 50;

function isValidTagLength(tag: string): boolean {
  const trimmed = tag.trim();
  return trimmed.length >= MIN_TAG_LENGTH && trimmed.length <= MAX_TAG_LENGTH;
}

export interface TagInputProps {
  /** Currently selected tags */
  value: Tag[];
  /** Callback when tags change */
  onChange: (tags: Tag[]) => void;
  /** Available tag suggestions */
  suggestions?: Tag[];
  /** Placeholder text for input */
  placeholder?: string;
  /** Allow creating new tags not in suggestions */
  allowCreate?: boolean;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether suggestions are loading */
  isLoading?: boolean;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Called when input loses focus */
  onBlur?: () => void;
  /** Size of the tag badges */
  tagSize?: 'sm' | 'md';
  /** Optional className */
  className?: string;
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Add tags...',
  allowCreate = true,
  disabled = false,
  isLoading = false,
  maxTags,
  onBlur,
  tagSize = 'sm',
  className,
}: TagInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const atMaxTags = maxTags !== undefined && value.length >= maxTags;

  // Filter suggestions (not already selected, matches input)
  const filteredSuggestions = useMemo(() => {
    const selectedIds = new Set(value.map((t) => t.id));
    return suggestions.filter((s) => {
      if (selectedIds.has(s.id)) return false;
      if (inputValue.trim()) {
        return s.label.toLowerCase().includes(inputValue.toLowerCase());
      }
      return true;
    });
  }, [suggestions, value, inputValue]);

  // Check if input matches an existing suggestion exactly
  const exactMatch = useMemo(() => {
    const trimmed = inputValue.trim().toLowerCase();
    return filteredSuggestions.find((s) => s.label.toLowerCase() === trimmed);
  }, [filteredSuggestions, inputValue]);

  // Can create a new tag?
  const canCreateNew =
    allowCreate &&
    isValidTagLength(inputValue) &&
    !exactMatch &&
    !value.some(
      (t) => t.label.toLowerCase() === inputValue.trim().toLowerCase()
    );

  // Combined list: suggestions + optional "create new" item
  const menuItems = useMemo(() => {
    const items: Array<{ type: 'suggestion' | 'create'; tag: Tag }> = [];
    filteredSuggestions.forEach((s) => {
      items.push({ type: 'suggestion', tag: s });
    });
    if (canCreateNew && !atMaxTags) {
      items.push({
        type: 'create',
        tag: {
          id: inputValue.trim().toLowerCase().replace(/\s+/g, '-'),
          label: inputValue.trim(),
          color: getTagColor(inputValue.trim()),
        },
      });
    }
    return items;
  }, [filteredSuggestions, canCreateNew, inputValue, atMaxTags]);

  const handleAddTag = useCallback(
    (tag: Tag) => {
      if (atMaxTags) return;
      // Ensure the tag has a color
      const tagWithColor: Tag = {
        ...tag,
        color: tag.color ?? getTagColor(tag.label),
      };
      onChange([...value, tagWithColor]);
      setInputValue('');
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    },
    [onChange, value, atMaxTags]
  );

  const handleRemoveTag = useCallback(
    (tagId: string) => {
      if (disabled) return;
      onChange(value.filter((t) => t.id !== tagId));
    },
    [onChange, value, disabled]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ',':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < menuItems.length) {
            const item = menuItems[highlightedIndex];
            if (item) {
              handleAddTag(item.tag);
            }
          } else if (menuItems.length > 0) {
            const firstItem = menuItems[0];
            if (firstItem) {
              handleAddTag(firstItem.tag);
            }
          }
          break;

        case 'Backspace':
          if (inputValue === '' && value.length > 0) {
            const lastTag = value[value.length - 1];
            if (lastTag) {
              handleRemoveTag(lastTag.id);
            }
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < menuItems.length - 1 ? prev + 1 : prev
          );
          setOpen(true);
          break;

        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;

        case 'Escape':
          setOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [
      disabled,
      highlightedIndex,
      menuItems,
      handleAddTag,
      inputValue,
      value,
      handleRemoveTag,
    ]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Handle comma as delimiter
    if (newValue.includes(',')) {
      const parts = newValue.split(',');
      const tagPart = parts[0]?.trim();
      if (tagPart && allowCreate && !atMaxTags && isValidTagLength(tagPart)) {
        const existingSuggestion = suggestions.find(
          (s) => s.label.toLowerCase() === tagPart.toLowerCase()
        );
        const alreadySelected = value.some(
          (t) => t.label.toLowerCase() === tagPart.toLowerCase()
        );
        if (!alreadySelected) {
          if (existingSuggestion) {
            handleAddTag(existingSuggestion);
          } else {
            handleAddTag({
              id: tagPart.toLowerCase().replace(/\s+/g, '-'),
              label: tagPart,
              color: getTagColor(tagPart),
            });
          }
        }
      }
      setInputValue('');
    } else {
      // Enforce max length on input
      if (newValue.length <= MAX_TAG_LENGTH) {
        setInputValue(newValue);
      }
    }
    setOpen(true);
    setHighlightedIndex(-1);
  };

  const handleContainerClick = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const handleBlur = useCallback(() => {
    // Delay to allow click events to fire
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false);
        onBlur?.();
      }
    }, 150);
  }, [onBlur]);

  // Reset highlighted index when menu items change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [menuItems.length]);

  const showDropdown = open && menuItems.length > 0;

  return (
    <div className={cn('w-full', className)} ref={containerRef}>
      <Popover.Root open={showDropdown} onOpenChange={setOpen}>
        <Popover.Anchor asChild>
          <div
            onClick={handleContainerClick}
            className={cn(
              'flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-md border bg-background px-3 py-2',
              'focus-within:ring-1 focus-within:ring-ring',
              disabled && 'cursor-not-allowed opacity-50',
              !disabled && 'cursor-text'
            )}
          >
            {/* Selected tags */}
            {value.map((tag) => (
              <TagBadge
                key={tag.id}
                label={tag.label}
                color={tag.color}
                size={tagSize}
                removable={!disabled}
                onRemove={() => handleRemoveTag(tag.id)}
                disabled={disabled}
              />
            ))}

            {/* Input field */}
            {!atMaxTags && (
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setOpen(true)}
                onBlur={handleBlur}
                disabled={disabled}
                placeholder={value.length === 0 ? placeholder : ''}
                className={cn(
                  'min-w-[120px] flex-1 bg-transparent text-sm outline-none',
                  'placeholder:text-muted-foreground',
                  'disabled:cursor-not-allowed'
                )}
                aria-label="Add tag"
              />
            )}

            {/* Loading indicator */}
            {isLoading && (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            )}
          </div>
        </Popover.Anchor>

        <Popover.Portal>
          <Popover.Content
            className={cn(
              'z-50 w-[var(--radix-popover-trigger-width)] rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[side=bottom]:slide-in-from-top-2',
              'data-[side=top]:slide-in-from-bottom-2'
            )}
            sideOffset={4}
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="max-h-60 overflow-y-auto">
              {menuItems.map((item, index) => (
                <button
                  key={
                    item.type === 'create'
                      ? `create-${item.tag.id}`
                      : item.tag.id
                  }
                  type="button"
                  onClick={() => handleAddTag(item.tag)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:outline-none focus:bg-accent focus:text-accent-foreground',
                    'transition-colors',
                    highlightedIndex === index &&
                      'bg-accent text-accent-foreground'
                  )}
                >
                  <TagBadge
                    label={item.tag.label}
                    color={item.tag.color}
                    size="sm"
                  />
                  {item.type === 'create' && (
                    <span className="text-xs text-muted-foreground">
                      (create new)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* Max tags message */}
      {atMaxTags && (
        <p className="mt-1 text-xs text-muted-foreground">
          Maximum of {maxTags} tags reached
        </p>
      )}
    </div>
  );
}

TagInput.displayName = 'TagInput';
