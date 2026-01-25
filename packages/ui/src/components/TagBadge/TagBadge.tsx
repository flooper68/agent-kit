import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type TagColorPreset =
  | 'gray'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'pink';

// Ordered list of tag colors for deterministic assignment
const TAG_COLORS: TagColorPreset[] = [
  'blue',
  'green',
  'purple',
  'orange',
  'teal',
  'pink',
  'yellow',
  'red',
  'gray',
];

/**
 * Deterministic color assignment based on tag label.
 * Returns a consistent color for any given tag string.
 */
export function getTagColor(label: string): TagColorPreset {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    const char = label.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const colorIndex = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[colorIndex] ?? 'gray';
}

const tagBadgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
  {
    variants: {
      color: {
        gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        red: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
        orange:
          'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
        yellow:
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
        green:
          'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
        teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
        purple:
          'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
        pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
      },
    },
    defaultVariants: {
      color: 'gray',
      size: 'sm',
    },
  }
);

export interface TagBadgeProps extends VariantProps<typeof tagBadgeVariants> {
  label: string;
  color?: TagColorPreset;
  size?: 'sm' | 'md';
  removable?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
}

export function TagBadge({
  label,
  color = 'gray',
  size = 'sm',
  removable = false,
  onRemove,
  disabled = false,
  className,
}: TagBadgeProps) {
  return (
    <span
      className={cn(
        tagBadgeVariants({ color, size }),
        disabled && 'opacity-50',
        className
      )}
    >
      {label}
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          disabled={disabled}
          className={cn(
            'rounded-full p-0.5 transition-colors',
            'hover:bg-black/10 dark:hover:bg-white/10',
            'focus:outline-none focus:ring-1 focus:ring-current',
            'disabled:pointer-events-none'
          )}
          aria-label={`Remove ${label}`}
        >
          <X className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        </button>
      )}
    </span>
  );
}

TagBadge.displayName = 'TagBadge';
