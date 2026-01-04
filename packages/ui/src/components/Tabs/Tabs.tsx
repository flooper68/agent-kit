import { forwardRef } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils';

// Tabs Root
export interface TabsProps extends React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Root
> {
  children: React.ReactNode;
}

const TabsRoot = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    className={cn('w-full', className)}
    {...props}
  />
));

TabsRoot.displayName = 'Tabs';

// Tabs List
export interface TabsListProps extends React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.List
> {
  children: React.ReactNode;
}

const TabsList = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1 rounded-lg bg-muted p-1',
      className
    )}
    {...props}
  />
));

TabsList.displayName = 'TabsList';

// Tabs Trigger
export interface TabsTriggerProps extends React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Trigger
> {
  children: React.ReactNode;
}

const TabsTrigger = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5',
      'text-sm font-medium text-muted-foreground',
      'ring-offset-background transition-all',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  >
    {children}
  </TabsPrimitive.Trigger>
));

TabsTrigger.displayName = 'TabsTrigger';

// Tabs Content
export interface TabsContentProps extends React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Content
> {
  children: React.ReactNode;
}

const TabsContent = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 ring-offset-background',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));

TabsContent.displayName = 'TabsContent';

// Compose Tabs
export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});
