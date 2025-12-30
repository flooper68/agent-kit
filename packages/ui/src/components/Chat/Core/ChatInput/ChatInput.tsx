import { forwardRef, createContext, useContext, useState } from 'react';
import { cn } from '../../../../lib/utils';
import { Textarea } from '../../../Textarea';
import { Button } from '../../../Button';

interface ChatInputContextValue {
  value: string;
  setValue: (value: string) => void;
  isSubmitting: boolean;
  canSubmit: boolean;
}

const ChatInputContext = createContext<ChatInputContextValue | undefined>(
  undefined
);

const useChatInput = () => {
  const context = useContext(ChatInputContext);
  if (!context) {
    throw new Error('useChatInput must be used within a ChatInput');
  }
  return context;
};

export interface ChatInputProps extends Omit<
  React.HTMLAttributes<HTMLFormElement>,
  'onSubmit'
> {
  value?: string;
  onValueChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  isSubmitting?: boolean;
  placeholder?: string;
}

const ChatInputRoot = forwardRef<HTMLFormElement, ChatInputProps>(
  (
    {
      value: controlledValue,
      onValueChange,
      onSubmit,
      isSubmitting = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = useState('');
    const value = controlledValue ?? uncontrolledValue;
    const canSubmit = value.trim().length > 0 && !isSubmitting;

    const setValue = (newValue: string) => {
      setUncontrolledValue(newValue);
      onValueChange?.(newValue);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (canSubmit) {
        onSubmit?.(value);
        setValue('');
      }
    };

    return (
      <ChatInputContext.Provider
        value={{ value, setValue, isSubmitting, canSubmit }}
      >
        <form
          ref={ref}
          className={cn(
            'flex flex-col gap-2 p-4 border-t bg-background',
            className
          )}
          onSubmit={handleSubmit}
          {...props}
        >
          {children}
        </form>
      </ChatInputContext.Provider>
    );
  }
);

ChatInputRoot.displayName = 'ChatInput';

// Textarea subcomponent
type ChatInputTextareaProps = Omit<
  React.ComponentProps<typeof Textarea>,
  'value' | 'onChange'
>;

const ChatInputTextarea = forwardRef<
  HTMLTextAreaElement,
  ChatInputTextareaProps
>(({ className, onKeyDown, ...props }, ref) => {
  const { value, setValue, canSubmit, isSubmitting } = useChatInput();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
    onKeyDown?.(e);
  };

  return (
    <Textarea
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={isSubmitting}
      autoResize
      maxHeight={200}
      className={cn('min-h-[44px]', className)}
      {...props}
    />
  );
});

ChatInputTextarea.displayName = 'ChatInputTextarea';

// Actions container
type ChatInputActionsProps = React.HTMLAttributes<HTMLDivElement>;

const ChatInputActions = forwardRef<HTMLDivElement, ChatInputActionsProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-between', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ChatInputActions.displayName = 'ChatInputActions';

// Send button
type ChatInputSendButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'type'
>;

const ChatInputSendButton = forwardRef<
  HTMLButtonElement,
  ChatInputSendButtonProps
>(({ className, children, disabled, ...props }, ref) => {
  const { canSubmit, isSubmitting } = useChatInput();

  return (
    <Button
      ref={ref}
      type="submit"
      disabled={disabled ?? !canSubmit}
      isLoading={isSubmitting}
      className={className}
      {...props}
    >
      {children ?? 'Send'}
    </Button>
  );
});

ChatInputSendButton.displayName = 'ChatInputSendButton';

export const ChatInput = Object.assign(ChatInputRoot, {
  Textarea: ChatInputTextarea,
  Actions: ChatInputActions,
  SendButton: ChatInputSendButton,
});

export { useChatInput };
export type {
  ChatInputTextareaProps,
  ChatInputActionsProps,
  ChatInputSendButtonProps,
};
