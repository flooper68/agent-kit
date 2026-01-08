import {
  forwardRef,
  memo,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../../lib/utils';
import type { AgentType } from '../../../../types/chat';

const AGENT_USAGE_STORAGE_KEY = 'agent-kit:agent-selector-usage';

// Provider display config
const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  gemini: 'Google',
};

interface AgentUsage {
  [agentId: string]: number; // timestamp of last use
}

function getStoredAgentUsage(): AgentUsage {
  try {
    const stored = localStorage.getItem(AGENT_USAGE_STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const validated: AgentUsage = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === 'number') {
            validated[key] = value;
          }
        }
        return validated;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

function saveAgentUsage(usage: AgentUsage): void {
  try {
    localStorage.setItem(AGENT_USAGE_STORAGE_KEY, JSON.stringify(usage));
  } catch {
    // Ignore storage errors
  }
}

export interface AgentSelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** List of available agents to select from */
  agents: AgentType[];
  /** Currently selected agent */
  selectedAgent?: AgentType;
  /** Callback when an agent is selected */
  onSelect?: (agent: AgentType) => void;
  /** Placeholder text when no agent is selected */
  placeholder?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

export const AgentSelector = memo(
  forwardRef<HTMLDivElement, AgentSelectorProps>(
    (
      {
        agents,
        selectedAgent,
        onSelect,
        placeholder = 'Select agent',
        disabled,
        className,
        ...props
      },
      ref
    ) => {
      const [isOpen, setIsOpen] = useState(false);
      const [searchQuery, setSearchQuery] = useState('');
      const [agentUsage, setAgentUsage] =
        useState<AgentUsage>(getStoredAgentUsage);
      const [dropdownPosition, setDropdownPosition] = useState<{
        top: number;
        left: number;
      } | null>(null);
      const searchInputRef = useRef<HTMLInputElement>(null);
      const triggerRef = useRef<HTMLButtonElement>(null);

      const handleClose = useCallback(() => {
        setIsOpen(false);
        setSearchQuery('');
      }, []);

      // Reload usage from storage when dropdown opens
      useEffect(() => {
        if (isOpen) {
          setAgentUsage(getStoredAgentUsage());
        }
      }, [isOpen]);

      const trackAgentUsage = useCallback((agentId: string) => {
        // Read fresh data from localStorage to avoid race conditions with other tabs
        const current = getStoredAgentUsage();
        const updated = { ...current, [agentId]: Date.now() };
        saveAgentUsage(updated);
        setAgentUsage(updated);
      }, []);

      // Normalize text for fuzzy matching
      const normalize = useCallback((text: string) => {
        return text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
          .replace(/[^a-z0-9\s]/g, ' ') // Replace special chars with spaces
          .replace(/\s+/g, ' ')
          .trim();
      }, []);

      // Sort agents: favorites first, then by recency (most recently used first)
      const sortedAgents = useMemo(() => {
        return [...agents].sort((a, b) => {
          // Favorites first
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          // Then by recency
          const aUsage = agentUsage[a.id] ?? 0;
          const bUsage = agentUsage[b.id] ?? 0;
          return bUsage - aUsage; // Most recent first
        });
      }, [agents, agentUsage]);

      // Filter agents based on fuzzy search
      const filteredAgents = useMemo(() => {
        if (!searchQuery.trim()) return sortedAgents;

        // Split query into tokens
        const tokens = normalize(searchQuery).split(' ').filter(Boolean);
        if (tokens.length === 0) return sortedAgents;

        return sortedAgents.filter((agent) => {
          // Build searchable text from all fields
          const searchableText = normalize(
            [agent.name, agent.model, agent.provider, agent.description]
              .filter(Boolean)
              .join(' ')
          );

          // All tokens must match somewhere in the searchable text
          return tokens.every((token) => searchableText.includes(token));
        });
      }, [sortedAgents, searchQuery, normalize]);

      // Close dropdown on Escape key
      useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            handleClose();
          }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }, [isOpen, handleClose]);

      // Calculate dropdown position when opening
      useLayoutEffect(() => {
        if (isOpen && triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          // Position above the trigger button
          setDropdownPosition({
            top: rect.top - 4, // 4px margin
            left: rect.left,
          });
        }
      }, [isOpen]);

      // Focus search input when dropdown opens
      useEffect(() => {
        if (isOpen && searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, [isOpen]);

      const handleSelect = (agent: AgentType) => {
        // Don't allow selecting disabled agents
        if (agent.disabled) return;
        trackAgentUsage(agent.id);
        onSelect?.(agent);
        handleClose();
      };

      return (
        <div ref={ref} className={cn('relative', className)} {...props}>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-2 px-2 py-1 text-sm rounded-md hover:bg-accent transition-colors',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {selectedAgent?.icon && (
              <span className="text-muted-foreground flex-shrink-0 [&>svg]:h-4 [&>svg]:w-4">
                {selectedAgent.icon}
              </span>
            )}
            <span className="font-medium">
              {selectedAgent?.name ?? placeholder}
            </span>
            <svg
              className={cn(
                'h-4 w-4 transition-transform',
                isOpen && 'rotate-180'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isOpen &&
            dropdownPosition &&
            createPortal(
              <>
                <div className="fixed inset-0 z-40" onClick={handleClose} />
                <div
                  className="fixed w-72 z-50 rounded-md border bg-popover shadow-md"
                  style={{
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    transform: 'translateY(-100%)',
                  }}
                >
                  <div className="p-2 border-b">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search agents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm rounded border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredAgents.length === 0 ? (
                      <div className="px-1.5 py-1 text-sm text-muted-foreground">
                        {agents.length === 0
                          ? 'No agents available'
                          : 'No agents found'}
                      </div>
                    ) : (
                      filteredAgents.map((agent) => (
                        <button
                          key={agent.id}
                          type="button"
                          onClick={() => handleSelect(agent)}
                          disabled={agent.disabled}
                          className={cn(
                            'w-full px-1.5 py-1 text-left text-sm transition-colors',
                            agent.disabled
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-accent',
                            agent.id === selectedAgent?.id && 'bg-accent'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {agent.icon && (
                              <span className="text-muted-foreground flex-shrink-0 [&>svg]:h-4 [&>svg]:w-4">
                                {agent.icon}
                              </span>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">
                                  {agent.name}
                                </span>
                                {agent.isFavorite && (
                                  <svg
                                    className="h-3 w-3 fill-yellow-400 text-yellow-400"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                )}
                                {agent.isLocal && !agent.disabled && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                    Custom
                                  </span>
                                )}
                                {agent.provider &&
                                  PROVIDER_LABELS[agent.provider] && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {PROVIDER_LABELS[agent.provider]}
                                    </span>
                                  )}
                                {agent.disabled && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                                    Offline
                                  </span>
                                )}
                              </div>
                              {agent.description && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {agent.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>,
              document.body
            )}
        </div>
      );
    }
  )
);

AgentSelector.displayName = 'AgentSelector';
