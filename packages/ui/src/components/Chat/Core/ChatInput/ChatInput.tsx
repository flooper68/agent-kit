import {
  forwardRef,
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  memo,
} from 'react';
import { cn } from '../../../../lib/utils';
import { Textarea } from '../../../Textarea';

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

export interface ChatInputProps
  extends Omit<React.HTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  value?: string;
  onValueChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  isSubmitting?: boolean;
  placeholder?: string;
}

const ChatInputRoot = memo(
  forwardRef<HTMLFormElement, ChatInputProps>(
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

      const setValue = useCallback(
        (newValue: string) => {
          setUncontrolledValue(newValue);
          onValueChange?.(newValue);
        },
        [onValueChange]
      );

      const handleSubmit = useCallback(
        (e: React.FormEvent) => {
          e.preventDefault();
          if (canSubmit) {
            onSubmit?.(value);
            setValue('');
          }
        },
        [canSubmit, onSubmit, value, setValue]
      );

      // Memoize context value to prevent unnecessary re-renders
      const contextValue = useMemo(
        () => ({ value, setValue, isSubmitting, canSubmit }),
        [value, setValue, isSubmitting, canSubmit]
      );

      return (
        <ChatInputContext.Provider value={contextValue}>
          <form
            ref={ref}
            className={cn(
              'flex flex-col gap-2 p-4 border rounded-xl bg-background shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md focus-within:border-primary/50',
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
  )
);

ChatInputRoot.displayName = 'ChatInput';

// Textarea subcomponent
type ChatInputTextareaProps = Omit<
  React.ComponentProps<typeof Textarea>,
  'value' | 'onChange'
>;

const ChatInputTextarea = memo(
  forwardRef<HTMLTextAreaElement, ChatInputTextareaProps>(
    ({ className, onKeyDown, ...props }, ref) => {
      const { value, setValue, canSubmit, isSubmitting } = useChatInput();

      const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
          if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
          onKeyDown?.(e);
        },
        [canSubmit, onKeyDown]
      );

      const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          setValue(e.target.value);
        },
        [setValue]
      );

      return (
        <Textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          autoResize
          maxHeight={200}
          className={cn(
            'min-h-[66px] border-0 shadow-none focus-visible:ring-0 px-0',
            className
          )}
          {...props}
        />
      );
    }
  )
);

ChatInputTextarea.displayName = 'ChatInputTextarea';

// Actions container
type ChatInputActionsProps = React.HTMLAttributes<HTMLDivElement>;

const ChatInputActions = memo(
  forwardRef<HTMLDivElement, ChatInputActionsProps>(
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
  )
);

ChatInputActions.displayName = 'ChatInputActions';

export const ChatInput = Object.assign(ChatInputRoot, {
  Textarea: ChatInputTextarea,
  Actions: ChatInputActions,
});

export { useChatInput };
export type { ChatInputTextareaProps, ChatInputActionsProps };
