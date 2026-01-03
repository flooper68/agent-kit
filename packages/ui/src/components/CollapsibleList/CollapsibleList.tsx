import { forwardRef, createContext, useContext, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

// Context for individual item state
interface CollapsibleListItemContextValue {
  isOpen: boolean;
  toggle: () => void;
}

const CollapsibleListItemContext = createContext<
  CollapsibleListItemContextValue | undefined
>(undefined);

export const useCollapsibleListItem = () => {
  const context = useContext(CollapsibleListItemContext);
  if (!context) {
    throw new Error(
      'useCollapsibleListItem must be used within a CollapsibleList.Item'
    );
  }
  return context;
};

// Root
export interface CollapsibleListProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CollapsibleListRoot = forwardRef<HTMLDivElement, CollapsibleListProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-border overflow-hidden',
        className
      )}
      role="list"
      {...props}
    >
      {children}
    </div>
  )
);

CollapsibleListRoot.displayName = 'CollapsibleList';

// Item
export interface CollapsibleListItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleListItem = forwardRef<
  HTMLDivElement,
  CollapsibleListItemProps
>(({ className, children, defaultOpen = false, ...props }, ref) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <CollapsibleListItemContext.Provider value={{ isOpen, toggle }}>
      <div
        ref={ref}
        className={cn('border-b border-border last:border-b-0', className)}
        role="listitem"
        data-state={isOpen ? 'open' : 'closed'}
        {...props}
      >
        {children}
      </div>
    </CollapsibleListItemContext.Provider>
  );
});

CollapsibleListItem.displayName = 'CollapsibleListItem';

// Trigger
export interface CollapsibleListTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  showChevron?: boolean;
}

const CollapsibleListTrigger = forwardRef<
  HTMLButtonElement,
  CollapsibleListTriggerProps
>(({ className, children, showChevron = true, onClick, ...props }, ref) => {
  const { isOpen, toggle } = useCollapsibleListItem();

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left',
        'transition-colors hover:bg-muted/50',
        className
      )}
      onClick={(e) => {
        toggle();
        onClick?.(e);
      }}
      {...props}
    >
      {showChevron && (
        <ChevronRight
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-90'
          )}
        />
      )}
      {children}
    </button>
  );
});

CollapsibleListTrigger.displayName = 'CollapsibleListTrigger';

// Content
export interface CollapsibleListContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CollapsibleListContent = forwardRef<
  HTMLDivElement,
  CollapsibleListContentProps
>(({ className, children, ...props }, ref) => {
  const { isOpen } = useCollapsibleListItem();

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={cn('px-4 py-3 border-t border-border bg-muted/30', className)}
      {...props}
    >
      {children}
    </div>
  );
});

CollapsibleListContent.displayName = 'CollapsibleListContent';

// Empty
export interface CollapsibleListEmptyProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CollapsibleListEmpty = forwardRef<
  HTMLDivElement,
  CollapsibleListEmptyProps
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('py-12 text-center text-sm text-muted-foreground', className)}
    {...props}
  >
    {children}
  </div>
));

CollapsibleListEmpty.displayName = 'CollapsibleListEmpty';

// Compose
export const CollapsibleList = Object.assign(CollapsibleListRoot, {
  Item: CollapsibleListItem,
  Trigger: CollapsibleListTrigger,
  Content: CollapsibleListContent,
  Empty: CollapsibleListEmpty,
});
