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
import {
  RichTextInput,
  type RichTextInputRef,
  type SlashCommandChip,
} from '../RichTextInput';

interface ChatInputContextValue {
  value: string;
  setValue: (value: string) => void;
  chips: SlashCommandChip[];
  setChips: (chips: SlashCommandChip[]) => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  /** Direct submit with explicit values (bypasses state) */
  submitWithValues: (text: string, chips: SlashCommandChip[]) => void;
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
  chips?: SlashCommandChip[];
  onChipsChange?: (chips: SlashCommandChip[]) => void;
  onSubmit?: (value: string, chips?: SlashCommandChip[]) => void;
  isSubmitting?: boolean;
  placeholder?: string;
}

const ChatInputRoot = memo(
  forwardRef<HTMLFormElement, ChatInputProps>(
    (
      {
        value: controlledValue,
        onValueChange,
        chips: controlledChips,
        onChipsChange,
        onSubmit,
        isSubmitting = false,
        className,
        children,
        ...props
      },
      ref
    ) => {
      const [uncontrolledValue, setUncontrolledValue] = useState('');
      const [uncontrolledChips, setUncontrolledChips] = useState<
        SlashCommandChip[]
      >([]);
      const value = controlledValue ?? uncontrolledValue;
      const chips = controlledChips ?? uncontrolledChips;
      const canSubmit =
        (value.trim().length > 0 || chips.length > 0) && !isSubmitting;

      const setValue = useCallback(
        (newValue: string) => {
          setUncontrolledValue(newValue);
          onValueChange?.(newValue);
        },
        [onValueChange]
      );

      const setChips = useCallback(
        (newChips: SlashCommandChip[]) => {
          setUncontrolledChips(newChips);
          onChipsChange?.(newChips);
        },
        [onChipsChange]
      );

      const handleSubmit = useCallback(
        (e: React.FormEvent) => {
          e.preventDefault();
          if (canSubmit) {
            onSubmit?.(value, chips.length > 0 ? chips : undefined);
            setValue('');
            setChips([]);
          }
        },
        [canSubmit, onSubmit, value, chips, setValue, setChips]
      );

      // Direct submit with explicit values (for RichTextarea to bypass state race conditions)
      const submitWithValues = useCallback(
        (text: string, submitChips: SlashCommandChip[]) => {
          const hasContent = text.trim().length > 0 || submitChips.length > 0;
          if (hasContent && !isSubmitting) {
            onSubmit?.(text, submitChips.length > 0 ? submitChips : undefined);
            setValue('');
            setChips([]);
          }
        },
        [isSubmitting, onSubmit, setValue, setChips]
      );

      // Memoize context value to prevent unnecessary re-renders
      const contextValue = useMemo(
        () => ({
          value,
          setValue,
          chips,
          setChips,
          isSubmitting,
          canSubmit,
          submitWithValues,
        }),
        [
          value,
          setValue,
          chips,
          setChips,
          isSubmitting,
          canSubmit,
          submitWithValues,
        ]
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

// RichTextarea subcomponent (for inline chips support)
export interface ChatInputRichTextareaProps {
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
  onCursorPositionChange?: (position: number) => void;
}

const ChatInputRichTextarea = memo(
  forwardRef<RichTextInputRef, ChatInputRichTextareaProps>(
    ({ placeholder, autoFocus, disabled, className, onCursorPositionChange }, ref) => {
      const {
        value,
        setValue,
        chips,
        setChips,
        isSubmitting,
        submitWithValues,
      } = useChatInput();

      const handleChange = useCallback(
        (newValue: string, newChips: SlashCommandChip[]) => {
          setValue(newValue);
          setChips(newChips);
        },
        [setValue, setChips]
      );

      const handleSubmit = useCallback(
        (text: string, submittedChips: SlashCommandChip[]) => {
          // Use submitWithValues to bypass state race conditions
          submitWithValues(text, submittedChips);
        },
        [submitWithValues]
      );

      return (
        <RichTextInput
          ref={ref}
          value={value}
          chips={chips}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCursorPositionChange={onCursorPositionChange}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          autoFocus={autoFocus}
          className={cn('border-0 shadow-none focus-visible:ring-0', className)}
        />
      );
    }
  )
);

ChatInputRichTextarea.displayName = 'ChatInputRichTextarea';

export const ChatInput = Object.assign(ChatInputRoot, {
  Textarea: ChatInputTextarea,
  RichTextarea: ChatInputRichTextarea,
  Actions: ChatInputActions,
});

export { useChatInput };
export type { ChatInputTextareaProps, ChatInputActionsProps, SlashCommandChip };
