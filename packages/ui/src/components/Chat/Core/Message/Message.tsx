import { forwardRef, createContext, useContext } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../lib/utils';
import { Avatar, type AvatarProps } from '../../../Avatar';
import type { MessageRole } from '../../../../types/chat';

const messageVariants = cva('flex gap-3 w-full animate-fade-in group', {
  variants: {
    role: {
      user: 'flex-row-reverse',
      assistant: 'flex-row',
      system: 'flex-row justify-center',
    },
  },
  defaultVariants: {
    role: 'assistant',
  },
});

const bubbleVariants = cva('max-w-[85%] text-sm', {
  variants: {
    role: {
      user: 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3',
      assistant: 'text-foreground',
      system:
        'bg-muted/50 text-muted-foreground text-center italic rounded-2xl px-4 py-3',
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

const MessageRoot = forwardRef<HTMLDivElement, MessageProps>(
  ({ role, className, children, ...props }, ref) => {
    return (
      <MessageContext.Provider value={{ role }}>
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
);

MessageRoot.displayName = 'Message';

// Message Avatar
type MessageAvatarProps = Omit<AvatarProps, 'size'>;

const MessageAvatar = forwardRef<HTMLDivElement, MessageAvatarProps>(
  ({ className, ...props }, ref) => {
    return (
      <Avatar
        ref={ref}
        size="md"
        className={cn('flex-shrink-0', className)}
        {...props}
      />
    );
  }
);

MessageAvatar.displayName = 'MessageAvatar';

// Message Bubble
type MessageBubbleProps = React.HTMLAttributes<HTMLDivElement>;

const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
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
);

MessageBubble.displayName = 'MessageBubble';

// Message Actions
type MessageActionsProps = React.HTMLAttributes<HTMLDivElement>;

const MessageActions = forwardRef<HTMLDivElement, MessageActionsProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
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
