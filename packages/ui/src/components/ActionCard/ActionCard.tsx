import { forwardRef, createContext, useContext } from 'react';
import { cn } from '../../lib/utils';

// Context for passing disabled state to children
interface ActionCardContextValue {
  disabled?: boolean;
}

const ActionCardContext = createContext<ActionCardContextValue>({});

// Root component
export interface ActionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
}

const ActionCardRoot = forwardRef<HTMLDivElement, ActionCardProps>(
  ({ className, disabled, children, ...props }, ref) => (
    <ActionCardContext.Provider value={{ disabled }}>
      <div
        ref={ref}
        className={cn(
          'rounded-lg border border-border bg-card transition-colors',
          disabled && 'opacity-60',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </ActionCardContext.Provider>
  )
);

ActionCardRoot.displayName = 'ActionCard';

// Header component
export interface ActionCardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  rightContent?: React.ReactNode;
  menuContent?: React.ReactNode;
}

const ActionCardHeader = forwardRef<HTMLDivElement, ActionCardHeaderProps>(
  (
    { className, icon, title, badge, rightContent, menuContent, ...props },
    ref
  ) => {
    const { disabled } = useContext(ActionCardContext);

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-between gap-3 p-4', className)}
        {...props}
      >
        {/* Left side: icon + title + badge */}
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div
              className={cn(
                'flex-shrink-0 rounded-md p-2',
                disabled
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {icon}
            </div>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-medium text-foreground truncate">{title}</h3>
            {badge}
          </div>
        </div>

        {/* Right side: custom content + menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {rightContent && (
            <span className="text-sm text-muted-foreground">
              {rightContent}
            </span>
          )}
          {menuContent}
        </div>
      </div>
    );
  }
);

ActionCardHeader.displayName = 'ActionCardHeader';

// Separator component
export interface ActionCardSeparatorProps
  extends React.HTMLAttributes<HTMLHRElement> {
  variant?: 'solid' | 'dashed';
}

const ActionCardSeparator = forwardRef<HTMLHRElement, ActionCardSeparatorProps>(
  ({ className, variant = 'dashed', ...props }, ref) => (
    <hr
      ref={ref}
      className={cn(
        'mx-4 border-t border-border',
        variant === 'dashed' && 'border-dashed',
        className
      )}
      {...props}
    />
  )
);

ActionCardSeparator.displayName = 'ActionCardSeparator';

// Content component
export type ActionCardContentProps = React.HTMLAttributes<HTMLDivElement>;

const ActionCardContent = forwardRef<HTMLDivElement, ActionCardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-4 py-3', className)} {...props} />
  )
);

ActionCardContent.displayName = 'ActionCardContent';

// Footer component
export interface ActionCardFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
}

const ActionCardFooter = forwardRef<HTMLDivElement, ActionCardFooterProps>(
  ({ className, leftActions, rightActions, children, ...props }, ref) => {
    const hasActions = leftActions || rightActions;

    // Don't render anything if no content provided
    if (!hasActions && !children) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between gap-2 px-4 pb-4',
          className
        )}
        {...props}
      >
        {hasActions ? (
          <>
            <div className="flex items-center gap-2">{leftActions}</div>
            <div className="flex items-center gap-2">{rightActions}</div>
          </>
        ) : (
          children
        )}
      </div>
    );
  }
);

ActionCardFooter.displayName = 'ActionCardFooter';

// Compose ActionCard
export const ActionCard = Object.assign(ActionCardRoot, {
  Header: ActionCardHeader,
  Separator: ActionCardSeparator,
  Content: ActionCardContent,
  Footer: ActionCardFooter,
});
