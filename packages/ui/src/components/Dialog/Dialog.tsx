import { forwardRef, createContext, useContext } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Context for dialog state
interface DialogContextValue {
  open: boolean;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a Dialog');
  }
  return context;
};

// Dialog Root
export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children: React.ReactNode;
}

const DialogRoot = ({
  open,
  defaultOpen,
  onOpenChange,
  modal = true,
  children,
}: DialogProps) => {
  // Wrap onOpenChange to defer close events, allowing Radix UI to clean up
  // the inert attribute before React re-renders
  const handleOpenChange = (newOpen: boolean) => {
    if (!onOpenChange) return;

    if (newOpen) {
      onOpenChange(true);
    } else {
      // Use requestAnimationFrame to defer until after browser paint
      // This gives Radix UI time to clean up the inert attribute
      requestAnimationFrame(() => {
        onOpenChange(false);
      });
    }
  };

  return (
    <DialogPrimitive.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={handleOpenChange}
      modal={modal}
    >
      <DialogContext.Provider value={{ open: open ?? false }}>
        {children}
      </DialogContext.Provider>
    </DialogPrimitive.Root>
  );
};

DialogRoot.displayName = 'Dialog';

// Dialog Trigger
export interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ children, asChild = false }, ref) => {
    return (
      <DialogPrimitive.Trigger ref={ref} asChild={asChild}>
        {children}
      </DialogPrimitive.Trigger>
    );
  }
);

DialogTrigger.displayName = 'DialogTrigger';

// Dialog Portal
interface DialogPortalProps {
  children: React.ReactNode;
  container?: HTMLElement;
}

const DialogPortal = ({ children, container }: DialogPortalProps) => {
  return (
    <DialogPrimitive.Portal container={container}>
      {children}
    </DialogPrimitive.Portal>
  );
};

DialogPortal.displayName = 'DialogPortal';

// Dialog Overlay
const DialogOverlay = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50',
      'data-[state=open]:animate-fade-in-fast data-[state=closed]:animate-fade-out-fast'
    )}
    {...props}
  />
));

DialogOverlay.displayName = 'DialogOverlay';

// Dialog Content
const contentVariants = cva(
  [
    'fixed z-50 bg-background rounded-lg shadow-lg',
    'border border-border',
    'focus:outline-none',
    'data-[state=open]:animate-fade-in-fast data-[state=closed]:animate-fade-out-fast',
  ],
  {
    variants: {
      position: {
        center: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
        left: 'left-0 top-0 h-full rounded-l-none',
        right: 'right-0 top-0 h-full rounded-r-none',
      },
      size: {
        sm: 'w-full max-w-sm p-4',
        md: 'w-full max-w-md p-6',
        lg: 'w-full max-w-lg p-6',
        xl: 'w-full max-w-xl p-6',
        '2xl': 'w-full max-w-4xl p-6',
        half: 'w-[50vw] max-w-none p-6',
        viewport: 'w-full h-[90vh] max-w-5xl p-6 flex flex-col',
        full: 'w-full h-full max-w-none rounded-none',
      },
    },
    defaultVariants: {
      position: 'center',
      size: 'md',
    },
  }
);

export interface DialogContentProps
  extends VariantProps<typeof contentVariants> {
  children: React.ReactNode;
  className?: string;
  showOverlay?: boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
}

const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  (
    {
      children,
      className,
      position,
      size,
      showOverlay = true,
      onEscapeKeyDown,
      onPointerDownOutside,
      onCloseAutoFocus,
    },
    ref
  ) => {
    return (
      <DialogPortal>
        {showOverlay && <DialogOverlay />}
        <DialogPrimitive.Content
          ref={ref}
          className={cn(contentVariants({ position, size }), className)}
          onEscapeKeyDown={onEscapeKeyDown}
          onPointerDownOutside={onPointerDownOutside}
          onCloseAutoFocus={onCloseAutoFocus}
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  }
);

DialogContent.displayName = 'DialogContent';

// Dialog Header
interface DialogHeaderProps {
  children: React.ReactNode;
}

const DialogHeader = ({ children }: DialogHeaderProps) => {
  return (
    <div className="flex flex-col space-y-2 text-center sm:text-left">
      {children}
    </div>
  );
};

DialogHeader.displayName = 'DialogHeader';

// Dialog Footer
interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

const DialogFooter = ({ children, className }: DialogFooterProps) => {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4',
        className
      )}
    >
      {children}
    </div>
  );
};

DialogFooter.displayName = 'DialogFooter';

// Dialog Title
const DialogTitle = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ children, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className="text-lg font-semibold leading-none tracking-tight"
    {...props}
  >
    {children}
  </DialogPrimitive.Title>
));

DialogTitle.displayName = 'DialogTitle';

// Dialog Description
const DialogDescription = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ children, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className="text-sm text-muted-foreground"
    {...props}
  >
    {children}
  </DialogPrimitive.Description>
));

DialogDescription.displayName = 'DialogDescription';

// Dialog Close
export interface DialogCloseProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ children, asChild = false }, ref) => {
    return (
      <DialogPrimitive.Close ref={ref} asChild={asChild}>
        {children}
      </DialogPrimitive.Close>
    );
  }
);

DialogClose.displayName = 'DialogClose';

// Compose Dialog
export const Dialog = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Content: DialogContent,
  Header: DialogHeader,
  Footer: DialogFooter,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
});

export { useDialog };
export type { DialogHeaderProps, DialogFooterProps };
