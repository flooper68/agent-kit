import type { ReactNode } from 'react';

// Provider icon components
const AnthropicIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.304 3.541h-3.672l6.696 16.918h3.672l-6.696-16.918Zm-10.608 0L0 20.459h3.744l1.368-3.564h6.576l1.368 3.564h3.744L10.104 3.541H6.696Zm.576 10.58 2.136-5.556 2.136 5.556H7.272Z" />
  </svg>
);

const OpenAIIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
  </svg>
);

const GeminiIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 0C5.352 0 0 5.352 0 12s5.352 12 12 12 12-5.352 12-12S18.648 0 12 0zm0 2.4c5.28 0 9.6 4.32 9.6 9.6a9.54 9.54 0 0 1-.528 3.12c-.768-2.064-2.928-3.504-6.672-4.32-1.392-.312-2.256-.552-2.544-.744-.288-.192-.432-.456-.432-.816 0-.384.168-.696.504-.936.336-.24.792-.36 1.368-.36.888 0 1.608.312 2.16.936l1.848-1.848c-.528-.624-1.176-1.104-1.944-1.44-.768-.336-1.608-.504-2.52-.504-1.296 0-2.376.36-3.24 1.08-.864.72-1.296 1.656-1.296 2.808 0 1.248.456 2.208 1.368 2.88.432.312 1.224.624 2.376.936 1.776.456 2.904.816 3.384 1.08.48.264.72.648.72 1.152 0 .48-.192.864-.576 1.152-.384.288-.912.432-1.584.432-1.2 0-2.16-.456-2.88-1.368l-1.944 1.944c1.008 1.272 2.496 1.908 4.464 1.908 1.44 0 2.616-.384 3.528-1.152.528-.432.912-.936 1.152-1.512A9.545 9.545 0 0 1 12 21.6c-5.28 0-9.6-4.32-9.6-9.6S6.72 2.4 12 2.4z" />
  </svg>
);

export interface ProviderConfig {
  bg: string;
  text: string;
  icon: ReactNode;
  label: string;
}

export const PROVIDER_CONFIG: Record<string, ProviderConfig> = {
  anthropic: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    icon: <AnthropicIcon className="h-3 w-3" />,
    label: 'Anthropic',
  },
  openai: {
    bg: 'bg-green-500/10',
    text: 'text-green-600 dark:text-green-400',
    icon: <OpenAIIcon className="h-3 w-3" />,
    label: 'OpenAI',
  },
  gemini: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    icon: <GeminiIcon className="h-3 w-3" />,
    label: 'Gemini',
  },
  'openai-reasoning': {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    icon: <OpenAIIcon className="h-3 w-3" />,
    label: 'OpenAI Reasoning',
  },
};

export const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  bg: 'bg-muted',
  text: 'text-muted-foreground',
  icon: null,
  label: 'Unknown',
};

export function getProviderConfig(provider: string): ProviderConfig {
  return PROVIDER_CONFIG[provider] ?? DEFAULT_PROVIDER_CONFIG;
}
