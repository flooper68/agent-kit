import { useState, createContext, useContext, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface CollapsibleContextValue {
  isOpen: boolean;
  toggle: () => void;
}

const CollapsibleContext = createContext<CollapsibleContextValue | undefined>(
  undefined
);

const useCollapsible = () => {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error('useCollapsible must be used within a Collapsible');
  }
  return context;
};

export interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CollapsibleRoot = forwardRef<HTMLDivElement, CollapsibleProps>(
  (
    {
      defaultOpen = false,
      open: controlledOpen,
      onOpenChange,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const isOpen = controlledOpen ?? uncontrolledOpen;

    const toggle = () => {
      const newValue = !isOpen;
      setUncontrolledOpen(newValue);
      onOpenChange?.(newValue);
    };

    return (
      <CollapsibleContext.Provider value={{ isOpen, toggle }}>
        <div
          ref={ref}
          data-state={isOpen ? 'open' : 'closed'}
          className={cn('', className)}
          {...props}
        >
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);

CollapsibleRoot.displayName = 'Collapsible';

export type CollapsibleTriggerProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;

const CollapsibleTrigger = forwardRef<
  HTMLButtonElement,
  CollapsibleTriggerProps
>(({ children, className, onClick, ...props }, ref) => {
  const { toggle } = useCollapsible();

  return (
    <button
      ref={ref}
      type="button"
      className={cn('flex items-center gap-2', className)}
      onClick={(e) => {
        toggle();
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
});

CollapsibleTrigger.displayName = 'CollapsibleTrigger';

export type CollapsibleContentProps = React.HTMLAttributes<HTMLDivElement>;

const CollapsibleContent = forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ children, className, ...props }, ref) => {
    const { isOpen } = useCollapsible();

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className={cn('overflow-hidden animate-slide-up', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CollapsibleContent.displayName = 'CollapsibleContent';

export const Collapsible = Object.assign(CollapsibleRoot, {
  Trigger: CollapsibleTrigger,
  Content: CollapsibleContent,
});

export { useCollapsible, CollapsibleTrigger, CollapsibleContent };
