import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

// DataList Root
export interface DataListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DataListRoot = forwardRef<HTMLDivElement, DataListProps>(
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

DataListRoot.displayName = 'DataList';

// DataList Item
export interface DataListItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DataListItem = forwardRef<HTMLDivElement, DataListItemProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-4 px-4 py-3',
        'border-b border-border last:border-b-0',
        'transition-colors hover:bg-muted/50',
        className
      )}
      role="listitem"
      {...props}
    >
      {children}
    </div>
  )
);

DataListItem.displayName = 'DataListItem';

// DataList Cell - for grouping content in items
export interface DataListCellProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  grow?: boolean;
  shrink?: boolean;
}

const DataListCell = forwardRef<HTMLDivElement, DataListCellProps>(
  ({ className, children, grow, shrink, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center',
        grow && 'flex-1 min-w-0',
        shrink && 'shrink-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

DataListCell.displayName = 'DataListCell';

// DataList Empty
export interface DataListEmptyProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DataListEmpty = forwardRef<HTMLDivElement, DataListEmptyProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'py-12 text-center text-sm text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

DataListEmpty.displayName = 'DataListEmpty';

// Compose DataList
export const DataList = Object.assign(DataListRoot, {
  Item: DataListItem,
  Cell: DataListCell,
  Empty: DataListEmpty,
});
