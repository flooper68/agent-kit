import { memo, useState } from 'react';
import { cn } from '../../../lib/utils';

export interface BreadcrumbItem {
  sessionId: string;
  title: string;
}

export interface SubAgentBreadcrumbProps {
  /** Array of breadcrumb items from root to current */
  items: BreadcrumbItem[];
  /** Callback when a breadcrumb item is clicked */
  onNavigate: (sessionId: string) => void;
  /** Maximum visible items before truncation (default: 4) */
  maxVisibleItems?: number;
}

// Chevron separator icon
const ChevronIcon = () => (
  <svg
    className="h-4 w-4 text-muted-foreground/50 flex-shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

// Ellipsis button for truncated items
const EllipsisButton = ({
  onClick,
  expanded,
}: {
  onClick: () => void;
  expanded: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'px-1.5 py-0.5 rounded text-sm text-muted-foreground',
      'hover:bg-muted hover:text-foreground transition-colors',
      expanded && 'bg-muted'
    )}
    aria-label="Show hidden breadcrumb items"
  >
    ...
  </button>
);

/**
 * Custom comparison function for SubAgentBreadcrumb memoization
 */
function areSubAgentBreadcrumbPropsEqual(
  prev: SubAgentBreadcrumbProps,
  next: SubAgentBreadcrumbProps
): boolean {
  if (prev.maxVisibleItems !== next.maxVisibleItems) return false;
  if (prev.onNavigate !== next.onNavigate) return false;
  if (prev.items.length !== next.items.length) return false;

  for (let i = 0; i < prev.items.length; i++) {
    const prevItem = prev.items[i];
    const nextItem = next.items[i];
    if (prevItem?.sessionId !== nextItem?.sessionId) return false;
    if (prevItem?.title !== nextItem?.title) return false;
  }

  return true;
}

export const SubAgentBreadcrumb = memo(function SubAgentBreadcrumb({
  items,
  onNavigate,
  maxVisibleItems = 4,
}: SubAgentBreadcrumbProps) {
  const [showTruncated, setShowTruncated] = useState(false);

  // If no items or single item, nothing to navigate
  if (items.length === 0) {
    return null;
  }

  const shouldTruncate = items.length > maxVisibleItems;

  // Calculate which items to show
  const getVisibleItems = (): {
    items: BreadcrumbItem[];
    truncatedItems: BreadcrumbItem[];
    truncatedStartIndex: number;
  } => {
    if (!shouldTruncate || showTruncated) {
      return { items, truncatedItems: [], truncatedStartIndex: -1 };
    }

    // Show first item, ellipsis, and last (maxVisibleItems - 2) items
    const firstItem = items[0];
    const endItems = items.slice(-(maxVisibleItems - 2));
    const truncatedItems = items.slice(1, items.length - (maxVisibleItems - 2));

    if (!firstItem) {
      return { items, truncatedItems: [], truncatedStartIndex: -1 };
    }

    return {
      items: [firstItem, ...endItems],
      truncatedItems,
      truncatedStartIndex: 1,
    };
  };

  const {
    items: visibleItems,
    truncatedItems,
    truncatedStartIndex,
  } = getVisibleItems();

  const renderBreadcrumbItem = (
    item: BreadcrumbItem,
    index: number,
    isLast: boolean,
    _actualIndex: number
  ) => {
    const isClickable = !isLast;

    return (
      <li key={item.sessionId} className="flex items-center gap-1.5">
        {index > 0 && <ChevronIcon />}
        {isClickable ? (
          <button
            type="button"
            onClick={() => onNavigate(item.sessionId)}
            className={cn(
              'max-w-[150px] truncate px-1.5 py-0.5 rounded text-sm',
              'text-muted-foreground hover:text-foreground hover:bg-muted',
              'transition-colors'
            )}
            title={item.title}
          >
            {item.title}
          </button>
        ) : (
          <span
            className={cn(
              'max-w-[150px] truncate px-1.5 py-0.5 text-sm',
              'text-foreground font-medium'
            )}
            title={item.title}
          >
            {item.title}
          </span>
        )}
      </li>
    );
  };

  return (
    <nav aria-label="Session breadcrumb">
      <ol className="flex items-center flex-wrap gap-0.5">
        {visibleItems.map((item, index) => {
          // Check if this is where the ellipsis should appear
          if (
            shouldTruncate &&
            !showTruncated &&
            index === truncatedStartIndex
          ) {
            const actualLastIndex = items.length - 1;
            const isCurrentLast =
              item.sessionId === items[actualLastIndex]?.sessionId;

            return (
              <li key="ellipsis-group" className="contents">
                {/* Ellipsis */}
                <li className="flex items-center gap-1.5">
                  <ChevronIcon />
                  <EllipsisButton
                    onClick={() => setShowTruncated(true)}
                    expanded={showTruncated}
                  />
                </li>
                {/* Truncated items dropdown (shown when expanded) */}
                {showTruncated &&
                  truncatedItems.map((truncItem, truncIndex) =>
                    renderBreadcrumbItem(
                      truncItem,
                      truncIndex + 1,
                      false,
                      truncIndex + 1
                    )
                  )}
                {/* Current item after ellipsis */}
                {renderBreadcrumbItem(item, index + 1, isCurrentLast, index)}
              </li>
            );
          }

          const actualLastIndex = items.length - 1;
          const isCurrentLast =
            item.sessionId === items[actualLastIndex]?.sessionId;

          return renderBreadcrumbItem(item, index, isCurrentLast, index);
        })}
      </ol>
    </nav>
  );
}, areSubAgentBreadcrumbPropsEqual);
