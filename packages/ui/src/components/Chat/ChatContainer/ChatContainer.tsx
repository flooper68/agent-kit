import { forwardRef } from 'react';
import { cn } from '../../../lib/utils';

export interface ChatContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const ChatContainer = forwardRef<HTMLDivElement, ChatContainerProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col h-full w-full bg-background overflow-hidden',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ChatContainer.displayName = 'ChatContainer';
