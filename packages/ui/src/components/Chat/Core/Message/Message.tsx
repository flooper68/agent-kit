import { forwardRef, createContext, useContext, memo, useMemo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../lib/utils';
import { Avatar, type AvatarProps } from '../../../Avatar';
import type { MessageRole } from '../../../../types/chat';

const messageVariants = cva(
  'flex flex-col gap-1 w-full animate-fade-in group',
  {
    variants: {
      role: {
        user: 'items-end',
        assistant: 'items-start',
        system: 'items-center',
      },
    },
    defaultVariants: {
      role: 'assistant',
    },
  }
);

const bubbleVariants = cva('text-sm', {
  variants: {
    role: {
      user: 'bg-muted text-foreground rounded-2xl rounded-br-sm px-3 py-0.5',
      assistant: 'text-foreground max-w-[85%]',
      system:
        'bg-muted/50 text-muted-foreground text-center italic rounded-2xl px-4 py-3 max-w-[85%]',
    },
  },
  defaultVariants: {
    role: 'assistant',
  },
});

interface MessageContextValue {
  role: MessageRole;
}

const MessageContext = createContext<MessageContextValue | undefined>(
  undefined
);

const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a Message');
  }
  return context;
};

export interface MessageProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof messageVariants> {
  role: MessageRole;
}

const MessageRoot = memo(
  forwardRef<HTMLDivElement, MessageProps>(
    ({ role, className, children, ...props }, ref) => {
      // Memoize context value to prevent unnecessary re-renders
      const contextValue = useMemo(() => ({ role }), [role]);

      return (
        <MessageContext.Provider value={contextValue}>
          <div
            ref={ref}
            className={cn(messageVariants({ role }), className)}
            {...props}
          >
            {children}
          </div>
        </MessageContext.Provider>
      );
    }
  )
);

MessageRoot.displayName = 'Message';

// Message Avatar
interface MessageAvatarProps extends Omit<AvatarProps, 'size'> {
  tooltip?: string;
}

const MessageAvatar = memo(
  forwardRef<HTMLDivElement, MessageAvatarProps>(
    ({ className, tooltip, ...props }, ref) => {
      return (
        <Avatar
          ref={ref}
          size="md"
          className={cn('flex-shrink-0', className)}
          title={tooltip}
          {...props}
        />
      );
    }
  )
);

MessageAvatar.displayName = 'MessageAvatar';

// Message Bubble
type MessageBubbleProps = React.HTMLAttributes<HTMLDivElement>;

const MessageBubble = memo(
  forwardRef<HTMLDivElement, MessageBubbleProps>(
    ({ className, children, ...props }, ref) => {
      const { role } = useMessage();
      return (
        <div
          ref={ref}
          className={cn(bubbleVariants({ role }), className)}
          {...props}
        >
          {children}
        </div>
      );
    }
  )
);

MessageBubble.displayName = 'MessageBubble';

// Message Actions
type MessageActionsProps = React.HTMLAttributes<HTMLDivElement>;

const MessageActions = memo(
  forwardRef<HTMLDivElement, MessageActionsProps>(
    ({ className, children, ...props }, ref) => {
      return (
        <div
          ref={ref}
          className={cn('flex items-center gap-1', className)}
          {...props}
        >
          {children}
        </div>
      );
    }
  )
);

MessageActions.displayName = 'MessageActions';

// Compose
export const Message = Object.assign(MessageRoot, {
  Avatar: MessageAvatar,
  Bubble: MessageBubble,
  Actions: MessageActions,
});

export { useMessage };
export type { MessageAvatarProps, MessageBubbleProps, MessageActionsProps };
