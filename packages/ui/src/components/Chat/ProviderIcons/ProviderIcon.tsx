import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  Bot,
  Brain,
  Sparkles,
  Wind,
  MessageSquare,
  Share2,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { AIProvider } from '../../../types/chat';

const providerIconVariants = cva('inline-flex items-center justify-center', {
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});

export interface ProviderIconProps
  extends
    Omit<React.SVGAttributes<SVGElement>, 'ref'>,
    VariantProps<typeof providerIconVariants> {
  provider: AIProvider | string;
  showFallback?: boolean;
}

const PROVIDER_ICONS: Record<AIProvider, LucideIcon> = {
  anthropic: Brain,
  openai: Bot,
  google: Sparkles,
  mistral: Wind,
  cohere: MessageSquare,
  meta: Share2,
  unknown: HelpCircle,
};

export const ProviderIcon = forwardRef<SVGSVGElement, ProviderIconProps>(
  ({ provider, size, className, showFallback = true, ...props }, ref) => {
    const normalizedProvider = provider.toLowerCase() as AIProvider;
    const IconComponent =
      PROVIDER_ICONS[normalizedProvider] ?? (showFallback ? HelpCircle : null);

    if (!IconComponent) return null;

    return (
      <IconComponent
        ref={ref}
        className={cn(providerIconVariants({ size }), className)}
        {...props}
      />
    );
  }
);

ProviderIcon.displayName = 'ProviderIcon';
