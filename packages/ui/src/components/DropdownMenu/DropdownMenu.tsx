import { forwardRef } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '../../lib/utils';

// DropdownMenu Root
const DropdownMenuRoot = DropdownMenuPrimitive.Root;

// DropdownMenu Trigger
export interface DropdownMenuTriggerProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger> {
  asChild?: boolean;
}

const DropdownMenuTrigger = forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Trigger>,
  DropdownMenuTriggerProps
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Trigger
    ref={ref}
    className={cn('outline-none', className)}
    {...props}
  />
));

DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

// DropdownMenu Content
export interface DropdownMenuContentProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> {
  sideOffset?: number;
}

const DropdownMenuContent = forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md',
        'data-[state=open]:animate-fade-in-fast data-[state=closed]:animate-fade-out-fast',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));

DropdownMenuContent.displayName = 'DropdownMenuContent';

// DropdownMenu Item
export interface DropdownMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  variant?: 'default' | 'destructive';
}

const DropdownMenuItem = forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(({ className, variant = 'default', ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
      'transition-colors focus:bg-accent focus:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      variant === 'destructive' && 'text-destructive focus:text-destructive',
      className
    )}
    {...props}
  />
));

DropdownMenuItem.displayName = 'DropdownMenuItem';

// DropdownMenu Separator
const DropdownMenuSeparator = forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
));

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

// DropdownMenu Label
const DropdownMenuLabel = forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-sm font-semibold', className)}
    {...props}
  />
));

DropdownMenuLabel.displayName = 'DropdownMenuLabel';

// Compose DropdownMenu
export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Trigger: DropdownMenuTrigger,
  Content: DropdownMenuContent,
  Item: DropdownMenuItem,
  Separator: DropdownMenuSeparator,
  Label: DropdownMenuLabel,
});
